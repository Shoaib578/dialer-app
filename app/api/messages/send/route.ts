import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/signalwire";
import { isValidE164 } from "@/lib/phone";

const MAX_BODY_LENGTH = 1600; // ~10 SMS segments

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const to = (json as { to?: unknown })?.to;
  const body = (json as { body?: unknown })?.body;

  if (typeof to !== "string" || !isValidE164(to)) {
    return NextResponse.json(
      { error: "Destination number must be a valid E.164 phone number." },
      { status: 400 }
    );
  }

  if (typeof body !== "string" || body.trim().length === 0) {
    return NextResponse.json({ error: "Message body cannot be empty." }, { status: 400 });
  }

  if (body.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Message body must be under ${MAX_BODY_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    const { sid, status } = await sendSms(to, body);
    return NextResponse.json({ sid, status });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 502 });
  }
}
