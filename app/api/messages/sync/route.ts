import { NextResponse } from "next/server";
import { syncInboundMessages } from "@/lib/messages";

// Pulls any newly received SMS from SignalWire and stores them — call this
// periodically/on demand instead of relying on an inbound SMS webhook.
export async function POST() {
  try {
    const inserted = await syncInboundMessages();
    return NextResponse.json({ inserted });
  } catch (error) {
    console.error("Failed to sync inbound messages:", error);
    return NextResponse.json({ error: "Failed to sync messages." }, { status: 502 });
  }
}
