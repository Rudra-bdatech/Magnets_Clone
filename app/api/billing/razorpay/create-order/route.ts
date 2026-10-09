import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getRazorpayClient, PLAN_PRICING } from "@/lib/billing";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Please log in to upgrade your subscription", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    await dbConnect();
    const account = await AccountModel.findOne({ email });
    if (!account) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // 2. Initialize Razorpay client
    const razorpay = getRazorpayClient();
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    // Graceful test/sandbox simulation if live API keys are not yet configured in .env
    if (!razorpay || !keyId) {
      const mockOrderId = `order_sim_${crypto.randomBytes(8).toString("hex")}`;
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: PLAN_PRICING.PRO_INR.amountPaise,
        currency: PLAN_PRICING.PRO_INR.currency,
        keyId: "rzp_test_mock_key",
        isSimulated: true,
        planName: "Pro Plan Monthly",
        user: {
          name: account.name || account.username || "Subscriber",
          email: account.email,
        },
        message: "Razorpay simulated order generated (Configure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET for production).",
      });
    }

    // 3. Create live Razorpay order
    const receiptId = `rcpt_${Date.now()}_${account._id.toString().slice(-6)}`;
    const options = {
      amount: PLAN_PRICING.PRO_INR.amountPaise, // in paise (₹1,999 = 199900)
      currency: PLAN_PRICING.PRO_INR.currency,
      receipt: receiptId,
      notes: {
        userId: account._id.toString(),
        userEmail: account.email,
        plan: "Pro",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      isSimulated: false,
      planName: "Pro Plan Monthly",
      user: {
        name: account.name || account.username || "Subscriber",
        email: account.email,
      },
    });
  } catch (error: any) {
    console.error("[Razorpay Order Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize payment order" },
      { status: 500 }
    );
  }
}
