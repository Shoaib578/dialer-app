import { NextRequest, NextResponse } from "next/server";
import { recordInboundMessage } from "@/lib/messages";

// Configure this as the "Handle using... LaML Webhooks" URL for inbound SMS
// on the SignalWire number: https://<your-domain>/api/webhooks/signalwire/sms
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const from = form.get("From");
  const body = form.get("Body");
  const messageSid = form.get("MessageSid");

  if (typeof from === "string" && typeof body === "string") {
    try {
      await recordInboundMessage(from, body, typeof messageSid === "string" ? messageSid : null);
    } catch (error) {
      console.error("Failed to record inbound message:", error);
    }
  }

  return new NextResponse("<Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
