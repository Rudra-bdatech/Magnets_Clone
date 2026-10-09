import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Authentication required to verify payment", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isSimulated } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: "Missing required payment details" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify signature if live keys are present and not in mock simulation mode
    if (keySecret && !isSimulated) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.error("[Razorpay Verification Failed]: Signature mismatch", {
          generated: generatedSignature,
          received: razorpay_signature,
        });
        return NextResponse.json(
          { error: "Invalid payment signature verification failed" },
          { status: 400 }
        );
      }
    }

    // Connect to DB and upgrade user account to Pro
    await dbConnect();
    const updatedAccount = await AccountModel.findOneAndUpdate(
      { email },
      {
        $set: {
          plan: "Pro",
          paymentProvider: "razorpay",
          paymentStatus: "paid",
          lastPaymentDate: new Date(),
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      },
      { new: true }
    );

    if (!updatedAccount) {
      return NextResponse.json({ error: "Account not found for update" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan: "Pro",
      message: "Subscription successfully activated! Pro features unlocked.",
      account: {
        email: updatedAccount.email,
        plan: updatedAccount.plan,
        name: updatedAccount.name,
      },
    });
  } catch (error: any) {
    console.error("[Razorpay Verify Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
