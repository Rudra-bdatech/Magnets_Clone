import { redirect } from "next/navigation";

export default function SetupRedirectPage() {
  redirect("/dashboard/get-started");
}
