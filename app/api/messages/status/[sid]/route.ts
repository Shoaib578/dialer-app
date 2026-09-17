import { NextResponse } from "next/server";
import { getMessageStatus } from "@/lib/signalwire";
import { recordDeliveryStatus } from "@/lib/messages";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/messages/status/[sid]">
) {
  const { sid } = await ctx.params;

  try {
    const { status, errorMessage } = await getMessageStatus(sid);
    await recordDeliveryStatus(sid, status, errorMessage);
    return NextResponse.json({ status, errorMessage });
  } catch (error) {
    console.error("Failed to fetch message status:", error);
    return NextResponse.json({ error: "Failed to fetch message status." }, { status: 502 });
  }
}
