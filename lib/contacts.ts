import "server-only";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";

export interface Contact {
  id: number;
  name: string;
  phone: string; // E.164
}

interface ContactRow extends RowDataPacket {
  id: number;
  name: string;
  phone_e164: string;
}

function fromRow(row: ContactRow): Contact {
  return { id: row.id, name: row.name, phone: row.phone_e164 };
}

export async function listContacts(): Promise<Contact[]> {
  const [rows] = await db.query<ContactRow[]>(
    "SELECT id, name, phone_e164 FROM app_contacts ORDER BY name ASC"
  );
  return rows.map(fromRow);
}

export async function createContact(name: string, phoneE164: string): Promise<Contact> {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO app_contacts (name, phone_e164) VALUES (?, ?)",
    [name, phoneE164]
  );
  return { id: result.insertId, name, phone: phoneE164 };
}

export async function findContactByPhone(phoneE164: string): Promise<Contact | null> {
  const [rows] = await db.query<ContactRow[]>(
    "SELECT id, name, phone_e164 FROM app_contacts WHERE phone_e164 = ? LIMIT 1",
    [phoneE164]
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function deleteContact(id: number): Promise<void> {
  await db.query("DELETE FROM app_contacts WHERE id = ?", [id]);
}
