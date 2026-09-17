import { NextResponse } from "next/server";
import { getCallStatus } from "@/lib/signalwire";
import { updateCallStatus } from "@/lib/callHistory";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/calls/[sid]">
) {
  const { sid } = await ctx.params;

  try {
    const status = await getCallStatus(sid);
    try {
      await updateCallStatus(sid, status.status, status.durationSec);
    } catch (dbError) {
      console.error("Failed to update call history:", dbError);
    }
    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to fetch call status:", error);
    return NextResponse.json({ error: "Failed to fetch call status." }, { status: 502 });
  }
}
