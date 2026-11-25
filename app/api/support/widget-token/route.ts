import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const secret = process.env.SUPPORT_WIDGET_JWT_SECRET;
    if (!secret) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }

    await dbConnect();
    const account = await AccountModel.findOne({ email }).lean();
    if (!account) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const externalUserId = account._id ? String(account._id) : "";
    if (!externalUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Name splitting:
    // first_name = first name, or part of full name before first space, or email prefix if no name
    // last_name = rest of name if available (omit if empty)
    const fullName = typeof account.name === "string" ? account.name.trim() : "";
    let firstName = "";
    let lastName = "";

    if (fullName) {
      const spaceIndex = fullName.indexOf(" ");
      if (spaceIndex !== -1) {
        firstName = fullName.slice(0, spaceIndex).trim();
        lastName = fullName.slice(spaceIndex + 1).trim();
      } else {
        firstName = fullName;
      }
    }

    if (!firstName) {
      const emailPrefix = (account.email || email).split("@")[0]?.trim();
      firstName = emailPrefix || "User";
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 12 * 60 * 60; // now + 12 hours

    const payload: Record<string, any> = {
      external_user_id: externalUserId,
      email: account.email || email,
      first_name: firstName,
      exp,
    };

    if (lastName) {
      payload.last_name = lastName;
    }

    const secretKey = new TextEncoder().encode(secret);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .sign(secretKey);

    return NextResponse.json(
      { token },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
