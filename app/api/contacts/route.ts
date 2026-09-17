import { NextRequest, NextResponse } from "next/server";
import { listContacts, createContact } from "@/lib/contacts";
import { toE164 } from "@/lib/phone";

export async function GET() {
  try {
    const contacts = await listContacts();
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Failed to list contacts:", error);
    return NextResponse.json({ error: "Failed to load contacts." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (json as { name?: unknown })?.name;
  const phone = (json as { phone?: unknown })?.phone;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const to = typeof phone === "string" ? toE164(phone) : null;
  if (!to) {
    return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  }

  try {
    const contact = await createContact(name.trim(), to);
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    const isDuplicate =
      error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY";
    if (isDuplicate) {
      return NextResponse.json(
        { error: "A contact with this phone number already exists." },
        { status: 409 }
      );
    }
    console.error("Failed to create contact:", error);
    return NextResponse.json({ error: "Failed to create contact." }, { status: 500 });
  }
}
