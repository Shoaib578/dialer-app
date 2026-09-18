import "server-only";
import * as XLSX from "xlsx";
import { toE164 } from "@/lib/phone";
import type { ContactInput } from "@/lib/contacts";

export interface ImportRowError {
  row: number; // 1-based, matches spreadsheet row incl. header
  reason: string;
}

export interface ParsedImport {
  contacts: ContactInput[];
  errors: ImportRowError[];
}

// Maps normalized (lowercased, punctuation-stripped) header text to the field it feeds.
const HEADER_ALIASES: Record<string, keyof RawFields> = {
  "first name": "firstName",
  "firstname": "firstName",
  "last name": "lastName",
  "lastname": "lastName",
  "phone": "phone",
  "phone number": "phone",
  "address": "address",
  "business name": "businessName",
  "business": "businessName",
  "lender": "lender",
  "loan amount": "loanAmount",
  "loan": "loanAmount",
  "misc": "misc",
  "miscellaneous": "misc",
  "notes": "notes",
  "note": "notes",
};

interface RawFields {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  businessName?: string;
  lender?: string;
  loanAmount?: string;
  misc?: string;
  notes?: string;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseLoanAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Parses a CSV or XLSX file buffer into contact rows, validating each row's phone number. */
export function parseContactsSpreadsheet(buffer: Buffer): ParsedImport {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  const errors: ImportRowError[] = [];
  if (rows.length === 0) {
    return { contacts: [], errors: [{ row: 1, reason: "Spreadsheet is empty." }] };
  }

  const headerRow = rows[0];
  const fieldByColumn: (keyof RawFields | null)[] = headerRow.map((h) => {
    const key = normalizeHeader(String(h ?? ""));
    return HEADER_ALIASES[key] ?? null;
  });

  if (!fieldByColumn.includes("phone")) {
    return {
      contacts: [],
      errors: [{ row: 1, reason: "No 'Phone' column found in the spreadsheet header." }],
    };
  }

  const contacts: ContactInput[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rawRow = rows[i];
    if (rawRow.every((cell) => String(cell ?? "").trim() === "")) continue; // blank row

    const fields: RawFields = {};
    fieldByColumn.forEach((field, colIdx) => {
      if (!field) return;
      const value = String(rawRow[colIdx] ?? "").trim();
      if (value) fields[field] = value;
    });

    const rowNumber = i + 1; // account for header row, 1-based
    const phone = fields.phone ? toE164(fields.phone) : null;
    if (!phone) {
      errors.push({ row: rowNumber, reason: `Invalid or missing phone number: "${fields.phone ?? ""}"` });
      continue;
    }

    if (!fields.firstName && !fields.lastName) {
      errors.push({ row: rowNumber, reason: "Missing first name and last name." });
      continue;
    }

    contacts.push({
      firstName: fields.firstName ?? "",
      lastName: fields.lastName ?? "",
      phone,
      address: fields.address ?? null,
      businessName: fields.businessName ?? null,
      lender: fields.lender ?? null,
      loanAmount: parseLoanAmount(fields.loanAmount),
      misc: fields.misc ?? null,
      notes: fields.notes ?? null,
    });
  }

  return { contacts, errors };
}
