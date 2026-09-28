import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { AUTH_COOKIE_NAME, verifySessionToken, setAuthCookie } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    let email: string | null = null;
    let name: string | undefined = undefined;

    if (token) {
      const session = verifySessionToken(token);
      if (session && session.email) {
        email = session.email;
        name = session.name;
      }
    }

    let nextAuthImage: string | null = null;
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      if (!email) {
        email = nextAuthSession.user.email.trim().toLowerCase();
        name = nextAuthSession.user.name || undefined;
      }
      if (nextAuthSession.user.image) {
        nextAuthImage = nextAuthSession.user.image;
      }
    }

    if (!email) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let account: any = null;
    try {
      await dbConnect();
      account = await AccountModel.findOne({ email }).lean();

      // Clean up legacy logo if it contains Google user avatar
      if (account) {
        let needsUpdate = false;
        const updateObj: any = {};
        if (nextAuthImage && (!account.avatar || account.avatar !== nextAuthImage)) {
          updateObj.avatar = nextAuthImage;
          account.avatar = nextAuthImage;
          needsUpdate = true;
        }
        if (account.logo && (account.logo.includes("googleusercontent.com") || account.logo === nextAuthImage)) {
          updateObj.logo = null;
          account.logo = null;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await AccountModel.updateOne({ email }, { $set: updateObj });
        }
      }
    } catch (e) {
      console.warn("Could not query DB for account in /api/auth/me:", e);
    }

    if (!account && email) {
      try {
        const baseName = name || email.split("@")[0];
        const generatedUsername = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15) || "user";
        const newAcc = {
          name: baseName,
          email: email,
          username: generatedUsername,
          password: "",
          plan: "Free",
          brandColor: "#0066B2",
          logo: null,
          avatar: nextAuthImage || null,
          joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          templateId: "template1",
          isNewAccount: true,
        };
        account = await AccountModel.create(newAcc);
        if (account && (account as any).toObject) {
          account = (account as any).toObject();
        }
      } catch (err) {
        console.error("Auto-creating account in /api/auth/me error:", err);
      }
    }

    if (!account && email) {
      account = {
        name: name || email.split("@")[0],
        email: email,
        username: email.split("@")[0],
        plan: "Free",
        brandColor: "#0066B2",
        logo: null,
        avatar: nextAuthImage || null,
      };
    }

    if (!account) {
      const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
      const { clearAuthCookie } = await import("@/lib/auth");
      clearAuthCookie(response);
      return response;
    }

    // Sanitize user object to never leak password hashes or sensitive keys to client
    const sanitizedUser = typeof (account as any).toObject === "function" ? (account as any).toObject() : { ...account };
    delete sanitizedUser.password;
    delete sanitizedUser.resetPasswordToken;
    delete sanitizedUser.resetPasswordExpires;
    delete sanitizedUser.linkedinLiAt;
    delete sanitizedUser.linkedinJSessionId;

    const response = NextResponse.json({
      authenticated: true,
      email: email,
      user: sanitizedUser || { email: email, name: name || email.split("@")[0] },
    });

    // Ensure custom session_token cookie is issued/synchronized for NextAuth / Google users
    setAuthCookie(response, email, name);

    return response;
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

