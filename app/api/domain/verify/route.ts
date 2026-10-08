import { NextResponse } from "next/server";
import {
  cleanDomain as sanitizeDomain,
  formatSubdomain,
  getDomainVerificationToken,
  formatFullHost,
} from "@/lib/domain-verify";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getPlanLimits } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user session
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Authentication required to verify custom domain", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    // 2. Query user account and verify plan tier
    await dbConnect();
    const account = await AccountModel.findOne({ email }).lean();
    if (!account) {
      return NextResponse.json(
        { error: "User account not found", code: "ACCOUNT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const planLimits = getPlanLimits(account.plan);
    if (!planLimits.customDomainAllowed) {
      return NextResponse.json(
        {
          error: "Custom domains are a Pro feature. Please upgrade your plan to connect a custom domain.",
          code: "PLAN_UPGRADE_REQUIRED",
          plan: account.plan || "Free",
        },
        { status: 403 }
      );
    }

    const { domain, subdomain } = await req.json();

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) {
      return NextResponse.json({ error: "Valid domain is required" }, { status: 400 });
    }

    const cleanSubdomain = formatSubdomain(subdomain);
    const expectedValue = getDomainVerificationToken(cleanDomain);
    const verificationHost = "leadmagnets-verify";
    const fullVerificationHost = `${verificationHost}.${cleanDomain}`;

    // Perform live DNS TXT lookup using Google Public DNS API
    const txtDnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(fullVerificationHost)}&type=TXT`;
    
    let isVerified = false;
    let dnsMessage = "";

    try {
      const dnsRes = await fetch(txtDnsUrl, { cache: "no-store" });
      const dnsData = await dnsRes.json();

      if (dnsData.Answer && Array.isArray(dnsData.Answer)) {
        const txtRecords = dnsData.Answer.map((ans: any) => (ans.data || "").replace(/^"|"$/g, "").trim());
        if (txtRecords.some((txt: string) => txt === expectedValue || txt.includes(expectedValue))) {
          isVerified = true;
          dnsMessage = "Domain ownership successfully verified!";
        }
      }

      if (!isVerified) {
        dnsMessage = `No TXT record matching '${expectedValue}' found at ${fullVerificationHost}. DNS can take 1 to 60 minutes to propagate.`;
      }
    } catch (dnsErr) {
      console.warn("DNS TXT check failed:", dnsErr);
      dnsMessage = `Unable to reach DNS resolution server for ${fullVerificationHost}. Please try again shortly.`;
    }

    // Perform live DNS CNAME lookup for the subdomain
    const fullSubdomainHost = formatFullHost(cleanDomain, cleanSubdomain);
    const cnameDnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(fullSubdomainHost)}&type=CNAME`;
    const targetCname = "cname.leadmagnets.so";
    let cnameVerified = false;
    let cnameMessage = "";

    try {
      const cnameRes = await fetch(cnameDnsUrl, { cache: "no-store" });
      const cnameData = await cnameRes.json();

      if (cnameData.Answer && Array.isArray(cnameData.Answer)) {
        const cnameRecords = cnameData.Answer.map((ans: any) => (ans.data || "").replace(/\.$/, "").toLowerCase().trim());
        if (cnameRecords.some((rec: string) => rec.includes("leadmagnets") || rec.includes("bdatech") || rec.includes("vercel") || rec.includes(targetCname))) {
          cnameVerified = true;
          cnameMessage = `Traffic successfully routed! ${fullSubdomainHost} points to ${cnameRecords[0] || targetCname}.`;
        }
      }

      if (!cnameVerified) {
        cnameMessage = `No CNAME record found pointing ${fullSubdomainHost} to magnets.bdatech.in. Check your DNS settings.`;
      }
    } catch (cnameErr) {
      console.warn("DNS CNAME check failed:", cnameErr);
      cnameMessage = `Unable to reach CNAME resolution server for ${fullSubdomainHost}.`;
    }

    // Auto-provision domain on Vercel programmatically if VERCEL API credentials are provided
    const vercelToken = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID_VERCEL;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (vercelToken && vercelProjectId && (isVerified || cnameVerified)) {
      try {
        const teamParam = vercelTeamId ? `?teamId=${vercelTeamId}` : "";
        // 1. Add domain to project
        await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains${teamParam}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: fullSubdomainHost }),
        });

        // 2. Trigger instant SSL/DNS verification on Vercel's edge network
        await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${fullSubdomainHost}/verify${teamParam}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        });
      } catch (vercelErr) {
        console.warn("Automated Vercel domain provisioning notice:", vercelErr);
      }
    }

    // Determine SSL certificate status
    const sslStatus = (isVerified || cnameVerified) ? "active" : "pending";

    return NextResponse.json({
      success: true,
      domain: cleanDomain,
      subdomain: cleanSubdomain,
      fullSubdomainHost,
      verificationHost,
      fullVerificationHost,
      expectedValue,
      cnameTarget: targetCname,
      isVerified,
      cnameVerified,
      sslStatus,
      message: dnsMessage,
      cnameMessage,
    });
  } catch (error: any) {
    console.error("Domain verification API error:", error);
    return NextResponse.json({ error: "Failed to verify domain" }, { status: 500 });
  }
}
