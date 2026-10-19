import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { getChargebeeClient, PLAN_PRICING, isStaffCoupon } from "@/lib/billing";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { isCompanyAccount } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawCode = typeof body?.couponCode === "string" ? body.couponCode : "";
    const cleanCode = rawCode.trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json(
        { error: "Please enter a coupon code", code: "COUPON_REQUIRED" },
        { status: 400 }
      );
    }

    const originalAmount = PLAN_PRICING.PRO_INR.amount; // 4999

    const invalidCoupon = () =>
      NextResponse.json(
        { success: false, valid: false, error: "Invalid or expired coupon code.", code: "INVALID_COUPON" },
        { status: 400 }
      );

    // Staff coupons: company accounts only. Others get the same answer as an unknown code,
    // and the code is never looked up in Chargebee for them.
    if (isStaffCoupon(cleanCode)) {
      await dbConnect();
      const account = await AccountModel.findOne({ email }, { role: 1 }).lean();
      if (!isCompanyAccount(email, (account as any)?.role)) {
        return invalidCoupon();
      }
      return NextResponse.json({
        success: true,
        valid: true,
        couponCode: cleanCode,
        name: cleanCode === "BDA1" ? "BDA Staff Special (₹1 Access)" : "Company Staff Special (₹1 Access)",
        discountAmount: 4998,
        finalAmount: 1,
        displayOriginal: "₹4,999",
        displayFinal: "₹1",
        savingsMessage: "You save ₹4,998! Pay only ₹1",
      });
    }

    // Check live Chargebee coupons
    const cb = getChargebeeClient();
    if (cb) {
      try {
        const result = await (cb as any).coupon.retrieve(cleanCode);
        const coupon = result.coupon;

        if (coupon && coupon.status === "active") {
          let discountRupees = 0;
          if (coupon.discount_type === "fixed_amount" && coupon.discount_amount) {
            discountRupees = Math.round(coupon.discount_amount / 100);
          } else if (coupon.discount_type === "percentage" && coupon.discount_percentage) {
            discountRupees = Math.round((originalAmount * coupon.discount_percentage) / 100);
          }

          const finalAmount = Math.max(1, originalAmount - discountRupees);

          return NextResponse.json({
            success: true,
            valid: true,
            couponCode: cleanCode,
            name: coupon.name || cleanCode,
            discountAmount: discountRupees,
            finalAmount,
            displayOriginal: `₹${originalAmount.toLocaleString("en-IN")}`,
            displayFinal: `₹${finalAmount.toLocaleString("en-IN")}`,
            savingsMessage: `You save ₹${discountRupees.toLocaleString("en-IN")}! Pay only ₹${finalAmount}`,
          });
        }
      } catch (cbErr: any) {
        console.warn("[Coupon Validate Warning]:", cbErr?.message || cbErr);
      }
    }

    return invalidCoupon();
  } catch (error: any) {
    console.error("[Validate Coupon Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
