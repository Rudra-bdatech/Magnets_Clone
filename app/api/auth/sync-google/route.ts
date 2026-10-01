import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { authOptions } from "@/lib/auth-options";
import { sanitizeAccount } from "@/lib/controllers/account";

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    let email: string | null = null;

    if (token) {
      const session = verifySessionToken(token);
      if (session?.email) {
        email = session.email.trim().toLowerCase();
      }
    }

    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      if (!email) {
        email = nextAuthSession.user.email.trim().toLowerCase();
      }
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    let googleImage = nextAuthSession?.user?.image || null;

    if (!googleImage) {
      return NextResponse.json({
        success: false,
        requireReauth: true,
        message: "No active Google session found. Please authenticate with Google to sync photo.",
      });
    }

    // Enhance to high-resolution Google avatar if applicable
    if (googleImage.includes("googleusercontent.com") && googleImage.includes("=s")) {
      googleImage = googleImage.replace(/=s\d+(-c)?/, "=s256-c");
    }

    await dbConnect();
    const updated = await AccountModel.findOneAndUpdate(
      { email },
      { avatar: googleImage },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      avatar: googleImage,
      account: sanitizeAccount(updated),
      message: "Google profile picture synced successfully!",
    });
  } catch (err: any) {
    console.error("Sync Google profile error:", err);
    return NextResponse.json({ success: false, error: "Failed to sync Google profile." }, { status: 500 });
  }
}
