import "server-only";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { findContactByPhone } from "@/lib/contacts";

export interface CallHistoryEntry {
  id: number;
  callSid: string | null;
  contactId: number | null;
  toNumber: string;
  fromNumber: string | null;
  status: string;
  durationSeconds: number | null;
  createdAt: string;
}

interface CallHistoryRow extends RowDataPacket {
  id: number;
  call_sid: string | null;
  contact_id: number | null;
  to_number_e164: string;
  from_number_e164: string | null;
  status: string;
  duration_seconds: number | null;
  created_at: string;
}

function fromRow(row: CallHistoryRow): CallHistoryEntry {
  return {
    id: row.id,
    callSid: row.call_sid,
    contactId: row.contact_id,
    toNumber: row.to_number_e164,
    fromNumber: row.from_number_e164,
    status: row.status,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  };
}

export async function listCallHistory(limit = 50): Promise<CallHistoryEntry[]> {
  const [rows] = await db.query<CallHistoryRow[]>(
    "SELECT id, call_sid, contact_id, to_number_e164, from_number_e164, status, duration_seconds, created_at FROM app_call_history ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows.map(fromRow);
}

export async function recordDialedCall(
  toNumber: string,
  fromNumber: string | null,
  callSid: string,
  status: string
): Promise<void> {
  const contact = await findContactByPhone(toNumber);
  await db.query<ResultSetHeader>(
    "INSERT INTO app_call_history (call_sid, contact_id, to_number_e164, from_number_e164, status, started_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
    [callSid, contact?.id ?? null, toNumber, fromNumber, status]
  );
}

export async function updateCallStatus(
  callSid: string,
  status: string,
  durationSeconds: number | null
): Promise<void> {
  const isEnded = ["completed", "busy", "failed", "no-answer", "canceled"].includes(status);
  await db.query(
    isEnded
      ? "UPDATE app_call_history SET status = ?, duration_seconds = ?, ended_at = CURRENT_TIMESTAMP WHERE call_sid = ?"
      : "UPDATE app_call_history SET status = ?, duration_seconds = ? WHERE call_sid = ?",
    [status, durationSeconds, callSid]
  );
}
