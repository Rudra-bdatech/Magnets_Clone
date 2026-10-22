import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { formatFullHost } from "@/lib/domain-verify";
import { getPlanLimits } from "@/lib/plan-limits";
import UserProfileRoute from "@/app/[username]/page";
import MagnetPageRoute, { generateMetadata as generateMagnetMetadata } from "@/app/[username]/[slug]/page";

export const dynamic = "force-dynamic";

interface DomainPageProps {
  searchParams: {
    host?: string;
    path?: string;
  };
}

/**
 * Normalizes host by removing protocol, port, and path.
 * Keeps a www label so www.brand.com only matches a www subdomain.
 */
function normalizeHost(rawHost: string): string {
  if (!rawHost) return "";
  return rawHost
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .trim();
}

/**
 * Finds the workspace whose verified host is exactly this request host.
 * Supports multi-part TLDs (get.yourbrand.co.uk -> sub "get", root "yourbrand.co.uk").
 * TXT-only or stale verification flags do not publish the site.
 */
async function resolveAccountForHost(rawHost: string) {
  const cleanHost = normalizeHost(rawHost);
  if (!cleanHost || !cleanHost.includes(".")) return null;

  await dbConnect();

  const parts = cleanHost.split(".");
  const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const orConditions: Record<string, unknown>[] = [];

  // Root must keep a dot (brand.com, brand.co.uk), so the left label is the subdomain.
  for (let i = 1; i < parts.length - 1; i++) {
    const sub = parts.slice(0, i).join(".");
    const root = parts.slice(i).join(".");
    orConditions.push({
      customDomain: { $regex: new RegExp(`^${escapeRegex(root)}$`, "i") },
      $or: [
        { customSubdomain: { $regex: new RegExp(`^${escapeRegex(sub)}$`, "i") } },
        ...(sub === "get"
          ? [
              { customSubdomain: { $in: ["", null] } },
              { customSubdomain: { $exists: false } },
            ]
          : []),
      ],
    });
  }

  if (orConditions.length === 0) return null;

  const account = await AccountModel.findOne({
    cnameVerified: true,
    $or: orConditions,
  }).lean();

  if (!account) return null;

  // A downgraded account (refund, cancellation) keeps its domain settings but stops serving on it
  if (!getPlanLimits((account as any).plan, (account as any).email, (account as any).role).customDomainAllowed) {
    return null;
  }

  const expectedHost = formatFullHost(
    (account as any).customDomain,
    (account as any).customSubdomain || "get"
  );
  if (!expectedHost || cleanHost !== expectedHost) return null;

  return account;
}

/**
 * Parses requested path and strips optional /username prefix.
 */
function parsePathAndSlug(rawPath: string, username?: string): { isRoot: boolean; slug: string } {
  let p = (rawPath || "/").trim();
  if (!p.startsWith("/")) p = "/" + p;

  // Remove leading /
  let cleaned = p.replace(/^\/+/, "");

  // If path starts with the user's username, strip it (e.g. /myusername/my-slug -> my-slug)
  if (username) {
    const userPrefix = `${username}/`;
    if (cleaned.toLowerCase().startsWith(userPrefix.toLowerCase())) {
      cleaned = cleaned.slice(userPrefix.length);
    } else if (cleaned.toLowerCase() === username.toLowerCase()) {
      cleaned = "";
    }
  }

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, "");

  if (!cleaned) {
    return { isRoot: true, slug: "" };
  }

  const segments = cleaned.split("/");
  return { isRoot: false, slug: segments[0] };
}

export async function generateMetadata({ searchParams }: DomainPageProps): Promise<Metadata> {
  const reqHeaders = headers();
  const host = searchParams?.host || reqHeaders.get("x-custom-domain") || reqHeaders.get("host") || "";
  const path = searchParams?.path || reqHeaders.get("x-original-path") || "/";

  const account: any = await resolveAccountForHost(host);
  if (!account || !account.username) {
    return {
      title: "Domain Setup Required | LeadMagnets",
      description: "This custom domain is routed to LeadMagnets but has not completed workspace setup.",
    };
  }

  const { isRoot, slug } = parsePathAndSlug(path, account.username);

  if (!isRoot && slug) {
    try {
      return await generateMagnetMetadata({
        params: { username: account.username, slug },
      });
    } catch {
      // Fallback to workspace metadata
    }
  }

  const title = account.name ? `${account.name} | Official Resources` : `@${account.username} · LeadMagnets`;
  const description = account.bio || `Explore free resources and lead magnets published by ${account.name || account.username}.`;
  const favicon = account.faviconUrl || undefined;

  return {
    title,
    description,
    icons: favicon ? [{ rel: "icon", url: favicon }] : undefined,
    openGraph: {
      title,
      description,
      images: account.ogImageUrl ? [{ url: account.ogImageUrl }] : undefined,
    },
  };
}

export default async function CustomDomainResolverPage({ searchParams }: DomainPageProps) {
  const reqHeaders = headers();
  const host = searchParams?.host || reqHeaders.get("x-custom-domain") || reqHeaders.get("host") || "";
  const path = searchParams?.path || reqHeaders.get("x-original-path") || "/";

  const cleanHost = normalizeHost(host);
  const account: any = await resolveAccountForHost(cleanHost);

  // If no account is associated with this domain, or verification is incomplete:
  if (!account || !account.username) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 selection:bg-blue-500 selection:text-white">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Domain Setup Incomplete
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Traffic for <code className="font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] font-bold">{cleanHost || "this domain"}</code> has reached our servers, but this domain is not currently connected to an active LeadMagnets workspace.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 p-4 text-left space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <p className="font-semibold text-zinc-900 dark:text-white">Are you the domain owner?</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <li>Log in to your LeadMagnets dashboard.</li>
              <li>Go to <strong>Workspace Setup &rarr; Custom Domain</strong>.</li>
              <li>Complete both <strong>Step 1 (TXT)</strong> and <strong>Step 2 (CNAME)</strong> verification.</li>
            </ol>
          </div>

          <div className="pt-2">
            <Link
              href="https://magnets.bdatech.in/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-bold transition shadow-sm"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Parse path to decide whether to render the workspace profile or a specific lead magnet
  const { isRoot, slug } = parsePathAndSlug(path, account.username);

  if (isRoot || !slug) {
    // Render the user's workspace profile with all featured lead magnets
    return <UserProfileRoute params={{ username: account.username }} />;
  }

  // Render the specific lead magnet requested
  return <MagnetPageRoute params={{ username: account.username, slug }} />;
}
