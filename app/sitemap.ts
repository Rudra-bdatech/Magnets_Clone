import { MetadataRoute } from "next";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://funnels.co.in";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    await dbConnect();

    // Query all published (live) lead magnet pages
    const livePages = (await MagnetPageModel.find({ status: "live" }).lean()) as any[];
    if (!livePages || livePages.length === 0) {
      return staticRoutes;
    }

    // Collect user emails to lookup usernames efficiently
    const userEmails = Array.from(new Set(livePages.map((p) => p.userEmail).filter(Boolean)));
    const accounts = (await AccountModel.find({ email: { $in: userEmails } }).lean()) as any[];

    const accountMap = new Map<string, string>();
    accounts.forEach((acc) => {
      if (acc.email && acc.username) {
        accountMap.set(acc.email.toLowerCase(), acc.username);
      }
    });

    const dynamicRoutes: MetadataRoute.Sitemap = livePages
      .map((page) => {
        const email = page.userEmail ? page.userEmail.toLowerCase() : "";
        const username = accountMap.get(email) || "u";
        const slug = page.slug || page.id;

        if (!slug) return null;

        const dateObj = page.updatedAt && !isNaN(Date.parse(page.updatedAt))
          ? new Date(page.updatedAt)
          : new Date();

        return {
          url: `${baseUrl}/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`,
          lastModified: dateObj,
          changeFrequency: "daily" as const,
          priority: 0.9,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.warn("MongoDB connection fallback in sitemap.ts:", error);
    return staticRoutes;
  }
}
