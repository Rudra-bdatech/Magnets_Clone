import { NextResponse } from "next/server";
import {
  cleanDomain as sanitizeDomain,
  formatSubdomain,
  getDomainVerificationToken,
  formatFullHost,
  getCnameTarget,
  cnameRecordMatchesTarget,
  VERCEL_CNAME_TARGET,
} from "@/lib/domain-verify";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

type HostingChallenge = { type: string; name: string; value: string };

type AttachResult = {
  attached: boolean;
  aliased: boolean;
  sslReady: boolean;
  skipped: boolean;
  certPending?: boolean;
  challenge?: HostingChallenge | null;
  error?: string;
};

function readHostingChallenge(body: any): HostingChallenge | null {
  const list = body?.verification || body?.domain?.verification;
  if (!Array.isArray(list)) return null;
  const first = list.find((item) => item?.type && (item?.value || item?.domain));
  if (!first?.value) return null;
  return {
    type: String(first.type || "TXT"),
    name: String(first.domain || first.name || "").replace(/\.$/, ""),
    value: String(first.value).replace(/^"|"$/g, ""),
  };
}

function vercelErrorMessage(body: any, fallback: string): string {
  return body?.error?.message || body?.message || fallback;
}

function isMissingCertMessage(message: string): boolean {
  return /ssl certificate|certificate/i.test(message) && /missing|not ready|pending|issu/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function issueVercelCertificate(
  fullHost: string,
  teamParam: string,
  headers: Record<string, string>
): Promise<{ ready: boolean; error?: string }> {
  const res = await fetch(`https://api.vercel.com/v8/certs${teamParam}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ cns: [fullHost] }),
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) return { ready: true };
  const message = vercelErrorMessage(body, "Vercel could not create an SSL certificate for this domain.");
  if (res.status === 409 || /already/i.test(message)) return { ready: true };
  return { ready: false, error: message };
}

/**
 * Adds the hostname to the Vercel project and aliases it to the current
 * production deployment. Adding the domain alone leaves Vercel answering
 * DEPLOYMENT_NOT_FOUND until the next production deploy.
 */
async function attachDomainToVercel(fullHost: string, matchedCname?: string): Promise<AttachResult> {
  const vercelToken = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID_VERCEL;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken || !vercelProjectId) {
    return { attached: true, aliased: true, sslReady: true, skipped: true };
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
    const addBody = await addRes.json().catch(() => ({}));

    if (!addRes.ok && addRes.status !== 409) {
      return {
        attached: false,
        aliased: false,
        sslReady: false,
        skipped: false,
        error: vercelErrorMessage(addBody, "DNS is correct, but the domain could not be attached to the site."),
      };
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
    const challenge = readHostingChallenge(verifyBody) || readHostingChallenge(addBody);
    const domainVerified = Boolean(verifyRes.ok && (verifyBody?.verified ?? verifyBody?.domain?.verified));

    const deploymentQuery = new URLSearchParams({
      projectId: vercelProjectId,
      target: "production",
      state: "READY",
      limit: "1",
    });
    if (vercelTeamId) deploymentQuery.set("teamId", vercelTeamId);

    const deploymentRes = await fetch(`https://api.vercel.com/v6/deployments?${deploymentQuery.toString()}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const deploymentBody = await deploymentRes.json().catch(() => ({}));
    const deploymentId = deploymentBody?.deployments?.[0]?.uid;

    if (!deploymentRes.ok || !deploymentId) {
      return {
        attached: true,
        aliased: false,
        sslReady: false,
        skipped: false,
        challenge,
        error: "The domain was added, but this project has no production deployment to serve it.",
      };
    }

    const pointsAtVercelEdge = matchedCname === VERCEL_CNAME_TARGET;
    const cert = await issueVercelCertificate(fullHost, teamParam, headers);

    const assignAlias = async () => {
      const aliasRes = await fetch(`https://api.vercel.com/v2/deployments/${deploymentId}/aliases${teamParam}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ alias: fullHost }),
        signal: AbortSignal.timeout(10000),
      });
      const aliasBody = await aliasRes.json().catch(() => ({}));
      const aliasMessage = vercelErrorMessage(aliasBody, "");
      const alreadyAssigned = aliasRes.status === 409 && /already assigned/i.test(aliasMessage);
      return { ok: aliasRes.ok || alreadyAssigned, message: aliasMessage };
    };

    let alias = await assignAlias();
    if (!alias.ok && pointsAtVercelEdge && isMissingCertMessage(alias.message)) {
      await sleep(5000);
      await issueVercelCertificate(fullHost, teamParam, headers);
      alias = await assignAlias();
    }

    if (alias.ok) {
      return {
        attached: true,
        aliased: true,
        sslReady: true,
        skipped: false,
        challenge: domainVerified ? null : challenge,
      };
    }

    const certPending = isMissingCertMessage(alias.message) || !cert.ready;
    const certDetail = !cert.ready && cert.error && !isMissingCertMessage(cert.error) ? ` ${cert.error}` : "";
    const ownershipMessage = challenge
      ? `Vercel still needs a ${challenge.type} record at ${challenge.name} with value ${challenge.value}. Add it, wait a minute, then click Verify CNAME again.`
      : !pointsAtVercelEdge
        ? `SSL cannot be created yet. Change the CNAME for ${fullHost} to ${VERCEL_CNAME_TARGET}, set Cloudflare proxy to DNS only, wait one minute, then click Verify CNAME again.`
        : `Vercel is still creating the SSL certificate for ${fullHost}.${certDetail} Wait 1 to 2 minutes, then click Verify CNAME again. The domain cannot go live until that certificate exists.`;

    return {
      attached: true,
      aliased: false,
      sslReady: false,
      skipped: false,
      certPending,
      challenge,
      error: ownershipMessage,
    };
  } catch (vercelErr) {
    console.warn("Automated Vercel domain provisioning notice:", vercelErr);
    return {
      attached: false,
      aliased: false,
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
    const targetCname = VERCEL_CNAME_TARGET;
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
    let matchedCname = "";
    let cnameMessage = "";

    try {
      const cnameLookup = await queryDns(fullSubdomainHost, "CNAME");
      cnameLookupFailed = cnameLookup.lookupFailed;
      if (!cnameLookupFailed) {
        const cnameRecords = readCnameValues(cnameLookup.records);
        const appTarget = getCnameTarget(process.env.NEXT_PUBLIC_APP_URL);
        matchedCname =
          cnameRecords.find((rec) => rec === VERCEL_CNAME_TARGET) ||
          cnameRecords.find((rec) => cnameRecordMatchesTarget(rec, appTarget)) ||
          "";
        cnameMatched = Boolean(matchedCname);
        if (cnameMatched) {
          cnameMessage = `Traffic successfully routed! ${fullSubdomainHost} points to ${matchedCname}.`;
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
          : `No CNAME record found pointing ${fullSubdomainHost} to ${VERCEL_CNAME_TARGET}. If using Cloudflare, set the proxy to DNS only.`;
      }
    }

    const provedThisRequest = Boolean(cnameMatched && isVerified && !cnameLookupFailed);
    let sslStatus: "pending" | "active" | "failed" = "pending";
    let vercelChallenge: HostingChallenge | null = null;

    if (!cnameVerified) {
      sslStatus = "pending";
    } else if (!provedThisRequest) {
      sslStatus = account.sslStatus === "active" || account.sslStatus === "failed" ? account.sslStatus : "pending";
    } else {
      const attach = await attachDomainToVercel(fullSubdomainHost, matchedCname);
      vercelChallenge = attach.challenge || null;
      if (!attach.attached || (!attach.skipped && !attach.aliased)) {
        cnameVerified = false;
        sslStatus = attach.certPending ? "pending" : "failed";
        cnameMessage = attach.error || "DNS is correct, but this domain could not be linked to the live deployment.";
      } else if (attach.skipped || attach.sslReady) {
        sslStatus = "active";
        cnameMessage = `Traffic successfully routed! ${fullSubdomainHost} is linked to the live deployment.`;
      } else {
        sslStatus = "pending";
        cnameMessage = `${fullSubdomainHost} is linked to the live deployment. HTTPS may take another minute. If the host still shows DEPLOYMENT_NOT_FOUND, click Verify CNAME again.`;
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
      vercelChallenge,
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
