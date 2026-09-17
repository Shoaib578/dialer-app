import { NextResponse } from "next/server";
import { hangUpCall } from "@/lib/signalwire";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/calls/[sid]/hangup">
) {
  const { sid } = await ctx.params;

  try {
    await hangUpCall(sid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to hang up call:", error);
    return NextResponse.json({ error: "Failed to hang up call." }, { status: 502 });
  }
}
