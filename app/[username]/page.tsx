import { notFound } from "next/navigation";
import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";
import { type MagnetPage, type Account } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function UserProfileRoute({
  params,
}: {
  params: { username: string };
}) {
  let accountDoc: any = null;
  let pages: any[] = [];

  try {
    const rawUser = params.username || "";
    if (rawUser.includes(".") || rawUser.startsWith("_") || rawUser === "favicon.ico") {
      notFound();
    }

    await dbConnect();
    const decodedUsername = decodeURIComponent(rawUser);
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    accountDoc = await AccountModel.findOne(
      escapedUsername ? { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } } : {}
    ).lean();

    if (!accountDoc) {
      // Fallback 1: Check if rawUser is actually a Lead Magnet slug
      const matchedPage = await MagnetPageModel.findOne({
        $or: [{ id: rawUser }, { slug: rawUser }]
      }).lean();

      if (matchedPage && matchedPage.userEmail) {
        const ownerAccount = await AccountModel.findOne({
          email: matchedPage.userEmail.trim().toLowerCase()
        }).lean();

        if (ownerAccount && ownerAccount.username) {
          const { redirect } = await import("next/navigation");
          redirect(`/${ownerAccount.username}/${matchedPage.slug || matchedPage.id}`);
        }
      }

      // Fallback 2: Check if rawUser matches a custom domain
      accountDoc = await AccountModel.findOne({
        $or: [
          { customDomain: rawUser.toLowerCase() },
          { customDomain: { $regex: new RegExp(escapedUsername, "i") } }
        ]
      }).lean();
    }

    if (accountDoc && accountDoc.email) {
      pages = await MagnetPageModel.find({
        userEmail: accountDoc.email.trim().toLowerCase(),
        status: "live",
      }).lean();
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.warn("MongoDB query error in UserProfileRoute:", err);
  }

  if (!accountDoc) {
    notFound();
  }

  const brandColor = accountDoc.brandColor || "#0066B2";
  const name = accountDoc.name || "Workspace";
  const logo = accountDoc.logo || null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-zinc-900 dark:text-white transition-colors duration-200 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center space-y-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#111726]/90 p-8 shadow-xl backdrop-blur-md">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-zinc-100 dark:border-zinc-800 shadow-md"
            />
          ) : (
            <div
              style={{ backgroundColor: brandColor }}
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white shadow-md"
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {name}
            </h1>
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              @{accountDoc.username}
            </p>
          </div>
        </div>

        {/* Lead Magnets Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
            Featured Lead Magnets ({pages.length})
          </h2>

          {pages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center bg-white/50 dark:bg-[#111726]/40">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No public lead magnets published yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pages.map((page: any) => {
                const slug = page.slug || page.id;
                const pageUrl = `/${accountDoc.username}/${slug}`;
                return (
                  <Link
                    key={page._id?.toString() || page.id}
                    href={pageUrl}
                    className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#111726] p-6 shadow-sm hover:shadow-lg hover:border-[#0066B2] dark:hover:border-[#0066B2] transition-all duration-200 cursor-pointer overflow-hidden"
                  >
                    {/* Top Color Accent */}
                    <div
                      style={{ backgroundColor: brandColor }}
                      className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity"
                    />

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors">
                        {page.name || "Untitled Lead Magnet"}
                      </h3>
                      {page.headline && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {page.headline}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/60 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8]">
                      <span>{page.cta || "Get instant access"}</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <p>Powered by LeadMagnets</p>
        </footer>
      </div>
    </main>
  );
}
