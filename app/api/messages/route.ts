import { NextResponse } from "next/server";
import { listRecentMessages } from "@/lib/signalwire";

export async function GET() {
  try {
    const messages = await listRecentMessages(50);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages." }, { status: 502 });
  }
}
