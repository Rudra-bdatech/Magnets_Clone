import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const funnel = await MagnetPageModel.findOne(
      { id: params.id },
      { userEmail: 1, slug: 1, id: 1 }
    ).lean() as any;

    if (!funnel) {
      return NextResponse.redirect(new URL("/", req.url), 302);
    }

    const account = await AccountModel.findOne(
      { email: (funnel.userEmail || "").toLowerCase().trim() },
      { username: 1 }
    ).lean() as any;

    if (!account?.username) {
      return NextResponse.redirect(new URL("/", req.url), 302);
    }

    const slug = funnel.slug || funnel.id;
    return NextResponse.redirect(
      new URL(`/${encodeURIComponent(account.username)}/${encodeURIComponent(slug)}`, req.url),
      302
    );
  } catch {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }
}
