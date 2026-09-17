import { NextRequest, NextResponse } from "next/server";
import { originateCallToCustomer } from "@/lib/signalwire";
import { isValidE164 } from "@/lib/phone";

// Very small in-memory guard against accidental rapid repeated dialing.
// Good enough for a single-user internal dialer; resets on server restart.
const RATE_LIMIT_WINDOW_MS = 3000;
let lastRequestAt = 0;

export async function POST(request: NextRequest) {
  const now = Date.now();
  if (now - lastRequestAt < RATE_LIMIT_WINDOW_MS) {
    return NextResponse.json(
      { error: "Please wait a moment before placing another call." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const to = (body as { to?: unknown })?.to;
  if (typeof to !== "string" || !isValidE164(to)) {
    return NextResponse.json(
      { error: "Destination number must be a valid E.164 phone number." },
      { status: 400 }
    );
  }

  lastRequestAt = now;

  try {
    const { callSid, status } = await originateCallToCustomer(to);
    return NextResponse.json({ callSid, status });
  } catch (error) {
    console.error("Failed to originate call:", error);
    return NextResponse.json(
      { error: "Failed to start call. Please try again." },
      { status: 502 }
    );
  }
}
