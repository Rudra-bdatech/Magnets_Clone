import { NextResponse } from "next/server";
import {
  cleanDomain as sanitizeDomain,
  formatSubdomain,
  getDomainVerificationToken,
  formatFullHost,
  getCnameTarget,
  cnameRecordMatchesTarget,
} from "@/lib/domain-verify";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export const dynamic = "force-dynamic";

type DnsLookup = { records: any[]; lookupFailed: boolean };

// Status 0 = success, Status 3 = NXDOMAIN. Both are a real answer from DNS.
function isDefinitiveDnsAnswer(payload: any): boolean {
  return payload?.Status === 0 || payload?.Status === 3;
}

// Helper to query multiple DNS over HTTPS resolvers (Google & Cloudflare) in parallel
async function queryDns(name: string, type: "TXT" | "CNAME"): Promise<DnsLookup> {
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

  const definitive = results.filter(
    (res) => res.status === "fulfilled" && isDefinitiveDnsAnswer(res.value)
  );
  if (definitive.length === 0) {
    return { records: [], lookupFailed: true };
  }

  const records: any[] = [];
  for (const res of definitive) {
    if (res.status === "fulfilled" && Array.isArray(res.value?.Answer)) {
      records.push(...res.value.Answer);
    }
  }
  return { records, lookupFailed: false };
}

function readTxtValues(records: any[]): string[] {
  const typed = records.filter((ans) => ans.type === 16);
  const rows = typed.length > 0 ? typed : records;
  return rows.map((ans) => String(ans.data || "").replace(/^"|"$/g, "").trim());
}

function readCnameValues(records: any[]): string[] {
  return records
    .filter((ans) => ans.type === 5)
    .map((ans) => String(ans.data || "").replace(/\.$/, "").toLowerCase().trim());
}

/**
 * Attaches the hostname to the Vercel project when credentials exist.
 * A missing token means this deployment is not using the Vercel domain API,
 * so DNS proof alone is enough. A failed attach must not be reported as live.
 */
async function attachDomainToVercel(fullHost: string): Promise<{
  attached: boolean;
  sslReady: boolean;
  skipped: boolean;
  error?: string;
}> {
  const vercelToken = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID_VERCEL;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken || !vercelProjectId) {
    return { attached: true, sslReady: true, skipped: true };
  }

  const teamParam = vercelTeamId ? `?teamId=${encodeURIComponent(vercelTeamId)}` : "";
  const domainPath = encodeURIComponent(fullHost);
  const headers = {
    Authorization: `Bearer ${vercelToken}`,
    "Content-Type": "application/json",
  };

  try {
    const addRes = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains${teamParam}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: fullHost }),
      signal: AbortSignal.timeout(10000),
    });

    if (!addRes.ok && addRes.status !== 409) {
      const addErr = await addRes.json().catch(() => ({}));
      const message =
        addErr?.error?.message ||
        addErr?.message ||
        "DNS is correct, but the domain could not be attached to the site.";
      return { attached: false, sslReady: false, skipped: false, error: message };
    }

    const verifyRes = await fetch(
      `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domainPath}/verify${teamParam}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${vercelToken}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    const verifyBody = await verifyRes.json().catch(() => ({}));
    const sslReady = Boolean(verifyRes.ok && (verifyBody?.verified ?? verifyBody?.domain?.verified));
    return { attached: true, sslReady, skipped: false };
  } catch (vercelErr) {
    console.warn("Automated Vercel domain provisioning notice:", vercelErr);
    return {
      attached: false,
      sslReady: false,
      skipped: false,
      error: "DNS is correct, but the hosting provider could not be reached to attach this domain.",
    };
  }
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

    const previousDomain = sanitizeDomain(account.customDomain);
    const previousSubdomain = formatSubdomain(account.customSubdomain || "get");
    const domainUnchanged = previousDomain === cleanDomain;
    const subdomainUnchanged = previousSubdomain === cleanSubdomain;

    // Per-user token: use the authenticated account's email so tokens are unique per user
    const expectedValue = getDomainVerificationToken(cleanDomain, account.email);
    const verificationHost = "leadmagnets-verify";
    const fullVerificationHost = `${verificationHost}.${cleanDomain}`;
    const targetCname = getCnameTarget(process.env.NEXT_PUBLIC_APP_URL);
    const fullSubdomainHost = formatFullHost(cleanDomain, cleanSubdomain);

    let isVerified = false;
    let txtLookupFailed = false;
    let dnsMessage = "";

    try {
      const txtLookup = await queryDns(fullVerificationHost, "TXT");
      txtLookupFailed = txtLookup.lookupFailed;
      if (!txtLookupFailed) {
        const txtRecords = readTxtValues(txtLookup.records);
        if (txtRecords.some((txt) => txt === expectedValue)) {
          isVerified = true;
          dnsMessage = "Domain ownership successfully verified!";
        }
      }
    } catch (dnsErr) {
      console.warn("DNS TXT check failed:", dnsErr);
      txtLookupFailed = true;
    }

    // A DNS outage must not wipe a domain that was already proved for this same host.
    if (!isVerified && txtLookupFailed && domainUnchanged && account.domainVerified) {
      isVerified = true;
      dnsMessage = "DNS lookup was unavailable. Existing ownership verification was kept. Try again shortly.";
    } else if (!isVerified) {
      dnsMessage = txtLookupFailed
        ? `Unable to reach DNS resolution server for ${fullVerificationHost}. Please try again shortly.`
        : `No TXT record matching '${expectedValue}' found at ${fullVerificationHost}. DNS can take 1 to 60 minutes to propagate.`;
    }

    let cnameVerified = false;
    let cnameLookupFailed = false;
    let cnameMatched = false;
    let cnameMessage = "";

    try {
      const cnameLookup = await queryDns(fullSubdomainHost, "CNAME");
      cnameLookupFailed = cnameLookup.lookupFailed;
      if (!cnameLookupFailed) {
        const cnameRecords = readCnameValues(cnameLookup.records);
        cnameMatched = cnameRecords.some((rec) => cnameRecordMatchesTarget(rec, targetCname));
        if (cnameMatched) {
          cnameMessage = `Traffic successfully routed! ${fullSubdomainHost} points to ${targetCname}.`;
        }
      }
    } catch (cnameErr) {
      console.warn("DNS CNAME check failed:", cnameErr);
      cnameLookupFailed = true;
    }

    if (cnameMatched && !isVerified) {
      cnameVerified = false;
      cnameMessage = "You must prove domain ownership (Step 1 TXT record) before verifying CNAME routing.";
    } else if (cnameMatched && isVerified) {
      cnameVerified = true;
    } else if (
      cnameLookupFailed &&
      domainUnchanged &&
      subdomainUnchanged &&
      account.cnameVerified &&
      isVerified
    ) {
      cnameVerified = true;
      cnameMessage = "DNS lookup was unavailable. Existing routing verification was kept. Try again shortly.";
    } else {
      cnameVerified = false;
      if (!cnameMessage) {
        cnameMessage = cnameLookupFailed
          ? `Unable to reach CNAME resolution server for ${fullSubdomainHost}.`
          : `No CNAME record found pointing ${fullSubdomainHost} to ${targetCname}. If using Cloudflare, ensure Proxy is set to DNS Only. You can also point the CNAME at cname.vercel-dns.com.`;
      }
    }

    const provedThisRequest = Boolean(cnameMatched && isVerified && !cnameLookupFailed);
    let sslStatus: "pending" | "active" | "failed" = "pending";

    if (!cnameVerified) {
      sslStatus = "pending";
    } else if (!provedThisRequest) {
      sslStatus = account.sslStatus === "active" || account.sslStatus === "failed" ? account.sslStatus : "pending";
    } else {
      const attach = await attachDomainToVercel(fullSubdomainHost);
      if (!attach.attached) {
        cnameVerified = false;
        sslStatus = "failed";
        cnameMessage = attach.error || "DNS is correct, but this domain could not be attached to the site.";
      } else if (attach.skipped || attach.sslReady) {
        sslStatus = "active";
        cnameMessage = `Traffic successfully routed! ${fullSubdomainHost} points to ${targetCname}.`;
      } else {
        sslStatus = "pending";
        cnameMessage = `CNAME is correct and ${fullSubdomainHost} is attached. The SSL certificate is still provisioning.`;
      }
    }

    // Always write the flags. A failed check clears a previous proof,
    // including when the user switched to a different domain or subdomain.
    await AccountModel.updateOne(
      { email },
      {
        $set: {
          customDomain: cleanDomain,
          customSubdomain: cleanSubdomain,
          domainVerified: isVerified,
          cnameVerified,
          sslStatus,
        },
      }
    );

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
