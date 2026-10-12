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

// Helper to query multiple DNS over HTTPS resolvers (Google & Cloudflare) in parallel
async function queryDns(name: string, type: "TXT" | "CNAME"): Promise<any[]> {
  const urls = [
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
  ];

  const results = await Promise.allSettled(
    urls.map((url) =>
      fetch(url, {
        headers: { Accept: "application/dns-json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }).then((r) => r.json())
    )
  );

  const records: any[] = [];
  for (const res of results) {
    if (res.status === "fulfilled" && res.value?.Answer && Array.isArray(res.value.Answer)) {
      records.push(...res.value.Answer);
    }
  }
  return records;
}

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

    const planLimits = getPlanLimits(account.plan, account.email, account.role);
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

    // Conflict Guard: Ensure domain is not already verified and active on another workspace
    const existingConflict = await AccountModel.findOne({
      email: { $ne: email },
      customDomain: cleanDomain,
      cnameVerified: true,
    }).lean();

    if (existingConflict) {
      return NextResponse.json(
        {
          error: "This custom domain is already verified and active on another workspace.",
          code: "DOMAIN_ALREADY_CLAIMED",
        },
        { status: 409 }
      );
    }

    // Per-user token: use the authenticated account's email so tokens are unique per user
    const expectedValue = getDomainVerificationToken(cleanDomain, account.email);
    const verificationHost = "leadmagnets-verify";
    const fullVerificationHost = `${verificationHost}.${cleanDomain}`;

    // CNAME target: driven from env variable so it never drifts from what the UI shows
    const targetCname = process.env.CNAME_TARGET || process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "magnets.bdatech.in";
    let isVerified = false;
    let dnsMessage = "";

    try {
      const txtAnswers = await queryDns(fullVerificationHost, "TXT");
      if (txtAnswers.length > 0) {
        const txtRecords = txtAnswers.map((ans: any) => (ans.data || "").replace(/^"|"$/g, "").trim());
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

    // 2. Perform live DNS CNAME lookup for the subdomain
    const fullSubdomainHost = formatFullHost(cleanDomain, cleanSubdomain);
    let cnameVerified = false;
    let cnameMessage = "";

    try {
      const cnameAnswers = await queryDns(fullSubdomainHost, "CNAME");
      if (cnameAnswers.length > 0) {
        // Filter specifically for CNAME records (DNS type 5) to avoid resolved A/AAAA IP records
        const cnameTypeAnswers = cnameAnswers.filter((ans: any) => ans.type === 5);
        const recordsToInspect = cnameTypeAnswers.length > 0 ? cnameTypeAnswers : cnameAnswers;
        const cnameRecords = recordsToInspect.map((ans: any) => (ans.data || "").replace(/\.$/, "").toLowerCase().trim());
        if (cnameRecords.some((rec: string) => rec.includes("leadmagnets") || rec.includes("bdatech") || rec.includes("vercel") || rec === targetCname || rec.includes(targetCname))) {
          cnameVerified = true;
          cnameMessage = `Traffic successfully routed! ${fullSubdomainHost} points to ${cnameRecords[0] || targetCname}.`;
        }
      }

      if (!cnameVerified) {
        cnameMessage = `No CNAME record found pointing ${fullSubdomainHost} to ${targetCname}. If using Cloudflare, ensure Proxy is set to DNS Only.`;
      }
    } catch (cnameErr) {
      console.warn("DNS CNAME check failed:", cnameErr);
      cnameMessage = `Unable to reach CNAME resolution server for ${fullSubdomainHost}.`;
    }

    // Strict Server-Side Ownership Enforcement:
    // CNAME routing can ONLY be granted if ownership has been proven (via current TXT check or prior verified state on this account)
    const isOwnershipProven = isVerified || Boolean(account.domainVerified && account.customDomain === cleanDomain);
    if (cnameVerified && !isOwnershipProven) {
      cnameVerified = false;
      cnameMessage = "You must prove domain ownership (Step 1 TXT record) before verifying CNAME routing.";
    }

    // Auto-provision domain on Vercel programmatically if VERCEL API credentials are provided
    // Only trigger when both ownership and CNAME routing are verified
    const vercelToken = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID_VERCEL;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (vercelToken && vercelProjectId && cnameVerified && isOwnershipProven) {
      try {
        const teamParam = vercelTeamId ? `?teamId=${vercelTeamId}` : "";
        // 1. Add domain to project
        const addRes = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains${teamParam}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: fullSubdomainHost }),
          signal: AbortSignal.timeout(10000),
        });

        // 2. Trigger instant SSL/DNS verification on Vercel's edge network
        const verifyRes = await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${fullSubdomainHost}/verify${teamParam}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!addRes.ok && addRes.status !== 409) {
          const addErr = await addRes.json().catch(() => ({}));
          console.warn("Vercel domain addition warning (non-fatal):", addErr);
        }
      } catch (vercelErr) {
        console.warn("Automated Vercel domain provisioning notice:", vercelErr);
      }
    }

    // SSL is active once CNAME points to our server and ownership is proven
    const sslStatus = cnameVerified ? "active" : "pending";

    // Secure Server-Side Persistence: Directly write verified status to DB
    const updateFields: any = {
      customDomain: cleanDomain,
      customSubdomain: cleanSubdomain,
    };
    if (isVerified) {
      updateFields.domainVerified = true;
    }
    if (cnameVerified) {
      updateFields.cnameVerified = true;
      updateFields.sslStatus = "active";
    }
    await AccountModel.updateOne({ email }, { $set: updateFields });

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

/**
 * DELETE: Disconnects custom domain and removes it from Vercel edge routing
 */
export async function DELETE() {
  try {
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const account = await AccountModel.findOne({ email });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const previousDomain = account.customDomain;
    const previousSubdomain = account.customSubdomain || "get";

    // Clean up domain from Vercel project if credentials exist
    const vercelToken = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID_VERCEL;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (vercelToken && vercelProjectId && previousDomain) {
      try {
        const fullHost = formatFullHost(previousDomain, previousSubdomain);
        const teamParam = vercelTeamId ? `?teamId=${vercelTeamId}` : "";
        await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${fullHost}${teamParam}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
          signal: AbortSignal.timeout(10000),
        });
      } catch (vercelErr) {
        console.warn("Failed to delete domain from Vercel:", vercelErr);
      }
    }

    // Reset domain fields in MongoDB
    account.customDomain = "";
    account.customSubdomain = "get";
    account.domainVerified = false;
    account.cnameVerified = false;
    account.sslStatus = "pending";
    await account.save();

    return NextResponse.json({
      success: true,
      message: "Custom domain disconnected and removed from Vercel successfully.",
    });
  } catch (error: any) {
    console.error("Delete domain error:", error);
    return NextResponse.json({ error: "Failed to disconnect domain" }, { status: 500 });
  }
}
