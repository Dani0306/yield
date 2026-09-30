import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/sidebar/DashboardShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
