import Dashboard from "@/components/dashboard";
import { dateKey } from "@/lib/tracker";
import { getTrackerData } from "@/lib/tracker-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getTrackerData();
  return <Dashboard initialData={data} todayKey={dateKey(new Date())}/>;
}
