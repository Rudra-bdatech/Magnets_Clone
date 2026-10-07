import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getAuthenticatedUserEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authEmail = await getAuthenticatedUserEmail();
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  await AccountModel.findOneAndUpdate(
    { email: authEmail },
    {
      $set: {
        "customSmtp.enabled": false,
        "customSmtp.host": "",
        "customSmtp.port": 587,
        "customSmtp.secure": false,
        "customSmtp.user": "",
        "customSmtp.pass": "",
        "customSmtp.fromEmail": "",
        "customSmtp.fromName": "",
        "customSmtp.isVerified": false,
      },
    }
  );

  return NextResponse.json({ success: true });
}
