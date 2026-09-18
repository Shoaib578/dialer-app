import { NextRequest, NextResponse } from "next/server";
import { importContacts } from "@/lib/contacts";
import { parseContactsSpreadsheet } from "@/lib/contactImport";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { contacts, errors } = parseContactsSpreadsheet(buffer);

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: "No valid contacts found in the file.", errors },
      { status: 400 }
    );
  }

  try {
    const summary = await importContacts(contacts);
    return NextResponse.json({ ...summary, errors });
  } catch (error) {
    console.error("Failed to import contacts:", error);
    return NextResponse.json({ error: "Failed to import contacts." }, { status: 500 });
  }
}
