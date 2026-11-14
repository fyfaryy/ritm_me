import { getTrackerData } from "@/lib/tracker-server";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await getTrackerData());
  } catch (error) {
    console.error("Tracker load failed", error);
    return Response.json({ error: "Не удалось загрузить привычки" }, { status: 500 });
  }
}
