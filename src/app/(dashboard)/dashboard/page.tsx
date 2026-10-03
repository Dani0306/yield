import DashboardContent from "@/components/dashboard/DashboardContent";
import { getDashboardData } from "@/actions/data/getDashboardData";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardContent data={data} />;
}
