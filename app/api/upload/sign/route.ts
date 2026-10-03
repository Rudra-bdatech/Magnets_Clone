import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAuthenticatedUserEmail } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const dynamic = "force-dynamic";

/**
 * POST /api/upload/sign
 * Generates a signed payload so the browser can upload large files (e.g. 50MB PDFs)
 * DIRECTLY to Cloudinary's raw/upload endpoint, completely bypassing Vercel's
 * 4.5MB Serverless Function payload limit.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionEmail = await getAuthenticatedUserEmail();
    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ error: "Cloudinary credentials not configured" }, { status: 500 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "leadmagnets";

    // Parameters to sign
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
    });
  } catch (err: any) {
    console.error("[upload/sign] Error generating signature:", err);
    return NextResponse.json({ error: "Failed to generate upload signature" }, { status: 500 });
  }
}
