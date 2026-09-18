import "server-only";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";

export interface Contact {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  phone: string; // E.164
  address: string | null;
  businessName: string | null;
  lender: string | null;
  loanAmount: number | null;
  misc: string | null;
  notes: string | null;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  phone: string; // E.164
  address?: string | null;
  businessName?: string | null;
  lender?: string | null;
  loanAmount?: number | null;
  misc?: string | null;
  notes?: string | null;
}

interface ContactRow extends RowDataPacket {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  phone_e164: string;
  address: string | null;
  business_name: string | null;
  lender: string | null;
  loan_amount: string | number | null;
  misc: string | null;
  notes: string | null;
}

const CONTACT_COLUMNS =
  "id, name, first_name, last_name, phone_e164, address, business_name, lender, loan_amount, misc, notes";

function fromRow(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone_e164,
    address: row.address,
    businessName: row.business_name,
    lender: row.lender,
    loanAmount: row.loan_amount === null ? null : Number(row.loan_amount),
    misc: row.misc,
    notes: row.notes,
  };
}

function fullName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export async function listContacts(): Promise<Contact[]> {
  const [rows] = await db.query<ContactRow[]>(
    `SELECT ${CONTACT_COLUMNS} FROM app_contacts ORDER BY name ASC`
  );
  return rows.map(fromRow);
}

export async function createContact(name: string, phoneE164: string): Promise<Contact> {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO app_contacts (name, first_name, last_name, phone_e164) VALUES (?, ?, ?, ?)",
    [name, firstName ?? "", lastName, phoneE164]
  );
  return {
    id: result.insertId,
    name,
    firstName: firstName ?? "",
    lastName,
    phone: phoneE164,
    address: null,
    businessName: null,
    lender: null,
    loanAmount: null,
    misc: null,
    notes: null,
  };
}

export async function findContactByPhone(phoneE164: string): Promise<Contact | null> {
  const [rows] = await db.query<ContactRow[]>(
    `SELECT ${CONTACT_COLUMNS} FROM app_contacts WHERE phone_e164 = ? LIMIT 1`,
    [phoneE164]
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function deleteContact(id: number): Promise<void> {
  await db.query("DELETE FROM app_contacts WHERE id = ?", [id]);
}

export interface ImportSummary {
  created: number;
  updated: number;
}

/** Bulk upsert used by spreadsheet import. Existing contacts (matched by phone) are overwritten. */
export async function importContacts(rows: ContactInput[]): Promise<ImportSummary> {
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const name = fullName(row.firstName, row.lastName);
    // affectedRows from ON DUPLICATE KEY UPDATE isn't a reliable created-vs-updated signal
    // (MySQL reports 1 for both a fresh insert and a no-op duplicate), so check first.
    const existing = await findContactByPhone(row.phone);
    await db.query<ResultSetHeader>(
      `INSERT INTO app_contacts
         (name, first_name, last_name, phone_e164, address, business_name, lender, loan_amount, misc, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         address = VALUES(address),
         business_name = VALUES(business_name),
         lender = VALUES(lender),
         loan_amount = VALUES(loan_amount),
         misc = VALUES(misc),
         notes = VALUES(notes)`,
      [
        name,
        row.firstName,
        row.lastName,
        row.phone,
        row.address ?? null,
        row.businessName ?? null,
        row.lender ?? null,
        row.loanAmount ?? null,
        row.misc ?? null,
        row.notes ?? null,
      ]
    );
    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return { created, updated };
}
