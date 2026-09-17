import { NextResponse } from "next/server";
import { getCallStatus } from "@/lib/signalwire";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/calls/[sid]">
) {
  const { sid } = await ctx.params;

  try {
    const status = await getCallStatus(sid);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to fetch call status:", error);
    return NextResponse.json({ error: "Failed to fetch call status." }, { status: 502 });
  }
}
