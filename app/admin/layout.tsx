import { redirect } from "next/navigation";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { determineRoleForEmail } from "@/lib/roles";
import AdminShell from "@/components/admin/admin-shell";

export const metadata = { title: "Admin — Funnels" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await getAuthenticatedUserEmail();
  if (!email) redirect("/login?from=/admin/users");

  await dbConnect();
  const account = await AccountModel.findOne({ email }, { role: 1, name: 1 }).lean() as any;
  if (!account) redirect("/login");

  const computedRole = determineRoleForEmail(email);
  const effectiveRole =
    computedRole === "super_admin" ? "super_admin" : (account.role || computedRole);

  if (effectiveRole !== "admin" && effectiveRole !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <AdminShell email={email} role={effectiveRole}>
      {children}
    </AdminShell>
  );
}
