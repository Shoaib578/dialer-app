import "server-only";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { findContactByPhone } from "@/lib/contacts";

export interface Chat {
  id: number;
  contactId: number | null;
  name: string | null;
  phone: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
}

export interface Message {
  id: number;
  chatId: number;
  messageSid: string | null;
  direction: "inbound" | "outbound";
  body: string;
  status: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface ChatRow extends RowDataPacket {
  id: number;
  contact_id: number | null;
  name: string | null;
  phone_e164: string;
  last_message_at: string | null;
  last_message_preview: string | null;
}

interface MessageRow extends RowDataPacket {
  id: number;
  chat_id: number;
  message_sid: string | null;
  direction: "inbound" | "outbound";
  body: string;
  status: string | null;
  error_message: string | null;
  created_at: string;
}

function chatFromRow(row: ChatRow): Chat {
  return {
    id: row.id,
    contactId: row.contact_id,
    name: row.name,
    phone: row.phone_e164,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
  };
}

function messageFromRow(row: MessageRow): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    messageSid: row.message_sid,
    direction: row.direction,
    body: row.body,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function listChats(): Promise<Chat[]> {
  const [rows] = await db.query<ChatRow[]>(
    "SELECT id, contact_id, name, phone_e164, last_message_at, last_message_preview FROM app_chats ORDER BY last_message_at IS NULL, last_message_at DESC"
  );
  return rows.map(chatFromRow);
}

export async function listMessagesForChat(chatId: number): Promise<Message[]> {
  const [rows] = await db.query<MessageRow[]>(
    "SELECT id, chat_id, message_sid, direction, body, status, error_message, created_at FROM app_messages WHERE chat_id = ? ORDER BY created_at ASC",
    [chatId]
  );
  return rows.map(messageFromRow);
}

async function getOrCreateChat(phoneE164: string): Promise<Chat> {
  const [rows] = await db.query<ChatRow[]>(
    "SELECT id, contact_id, name, phone_e164, last_message_at, last_message_preview FROM app_chats WHERE phone_e164 = ? LIMIT 1",
    [phoneE164]
  );
  if (rows[0]) return chatFromRow(rows[0]);

  const contact = await findContactByPhone(phoneE164);
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO app_chats (contact_id, name, phone_e164) VALUES (?, ?, ?)",
    [contact?.id ?? null, contact?.name ?? null, phoneE164]
  );
  return {
    id: result.insertId,
    contactId: contact?.id ?? null,
    name: contact?.name ?? null,
    phone: phoneE164,
    lastMessageAt: null,
    lastMessagePreview: null,
  };
}

const PREVIEW_LENGTH = 120;

async function recordMessage(
  phoneE164: string,
  direction: "inbound" | "outbound",
  body: string,
  messageSid: string | null,
  status: string | null,
  errorMessage: string | null = null
): Promise<Message> {
  const chat = await getOrCreateChat(phoneE164);

  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO app_messages (chat_id, message_sid, direction, body, status, error_message) VALUES (?, ?, ?, ?, ?, ?)",
    [chat.id, messageSid, direction, body, status, errorMessage]
  );

  await db.query(
    "UPDATE app_chats SET last_message_at = CURRENT_TIMESTAMP, last_message_preview = ? WHERE id = ?",
    [body.slice(0, PREVIEW_LENGTH), chat.id]
  );

  return {
    id: result.insertId,
    chatId: chat.id,
    messageSid,
    direction,
    body,
    status,
    errorMessage,
    createdAt: new Date().toISOString(),
  };
}

export async function recordOutboundMessage(
  toPhoneE164: string,
  body: string,
  messageSid: string,
  status: string
): Promise<Message> {
  return recordMessage(toPhoneE164, "outbound", body, messageSid, status);
}

export async function recordInboundMessage(
  fromPhoneE164: string,
  body: string,
  messageSid: string | null
): Promise<Message> {
  return recordMessage(fromPhoneE164, "inbound", body, messageSid, "received");
}
