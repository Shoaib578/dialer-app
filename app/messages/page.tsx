"use client";

import { useEffect, useRef, useState } from "react";
import type { Chat, Message } from "@/lib/messages";
import { formatPhoneForDisplay, toE164 } from "@/lib/phone";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30000;
const FAILED_STATUSES = ["failed", "undelivered"];
const INBOUND_SYNC_INTERVAL_MS = 10000;

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(key: string): string {
  const sum = key.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function avatarInitials(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length > 1) return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return label.replace(/\D/g, "").slice(-2) || "?";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Delivery is confirmed asynchronously via a SignalWire status-callback
// webhook, so we poll our own DB until it lands rather than trusting the
// send response (which is always "queued"). Kept outside the component so
// its use of Date.now()/setTimeout isn't mistaken for render-time work.
function pollMessageUntilResolved(
  sid: string,
  onDelivered: () => void,
  onFailed: (message: string) => void
) {
  const startedAt = Date.now();

  const tick = async () => {
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) return;

    try {
      const res = await fetch(`/api/messages/status/${sid}`);
      const data = await res.json();
      const status = res.ok ? (data.status as string | null) : null;

      if (status === "delivered") {
        onDelivered();
        return;
      }
      if (status && FAILED_STATUSES.includes(status)) {
        onFailed(data.errorMessage || "Message failed to deliver.");
        return;
      }
    } catch {
      // Transient poll failure — try again on the next tick.
    }

    setTimeout(tick, POLL_INTERVAL_MS);
  };

  setTimeout(tick, POLL_INTERVAL_MS);
}

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChatIdRef = useRef<number | null>(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  const loadChats = async () => {
    setChatsLoading(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) setChats(data.chats);
    } finally {
      setChatsLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages/${chatId}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } finally {
      setMessagesLoading(false);
    }
  };

  // No inbound webhook is configured, so we pull newly received messages
  // from SignalWire ourselves — on load, periodically, and via the Sync button.
  const syncInbound = async (forceReload = false) => {
    try {
      const res = await fetch("/api/messages/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && (data.inserted > 0 || forceReload)) {
        await loadChats();
        if (activeChatIdRef.current !== null) await loadMessages(activeChatIdRef.current);
      }
    } catch {
      // Transient sync failure — the next interval tick will retry.
    }
  };

  useEffect(() => {
    loadChats();
    syncInbound();
    const interval = setInterval(syncInbound, INBOUND_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeChatId !== null) loadMessages(activeChatId);
  }, [activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const handleNewChat = () => {
    setActiveChatId(null);
    setTo("");
    setBody("");
    setError(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const destination = activeChat ? activeChat.phone : toE164(to);
    if (!destination) {
      setError("Enter a valid phone number.");
      return;
    }
    if (!body.trim()) {
      setError("Message can't be empty.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: destination, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send message.");

      setBody("");
      setTo("");
      await loadChats();

      const chat = activeChat ?? chats.find((c) => c.phone === destination);
      const chatId = chat?.id ?? (await fetchChatIdByPhone(destination));
      if (chatId) {
        setActiveChatId(chatId);
        pollMessageUntilResolved(
          data.sid,
          () => {
            loadChats();
            loadMessages(chatId);
          },
          (message) => showToast(message)
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const fetchChatIdByPhone = async (phone: string): Promise<number | null> => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (!res.ok) return null;
    setChats(data.chats);
    const chat = (data.chats as Chat[]).find((c) => c.phone === phone);
    return chat?.id ?? null;
  };

  return (
    <div className="flex flex-1 justify-center bg-slate-100 p-4">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-red-200">
          {toast}
        </div>
      )}

      <div className="flex w-full max-w-5xl gap-4">
        <div className="flex h-[calc(100vh-8rem)] w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5">
            <h2 className="text-base font-semibold text-gray-900">Chats</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => syncInbound(true)}
                aria-label="Sync"
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-slate-100 hover:text-gray-600"
              >
                ⟳
              </button>
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                + New
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatsLoading && <p className="p-4 text-center text-sm text-gray-400">Loading…</p>}
            {!chatsLoading && chats.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-400">No chats yet.</p>
            )}
            <ul className="divide-y divide-gray-50">
              {chats.map((chat) => {
                const label = chat.name ?? formatPhoneForDisplay(chat.phone);
                return (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => setActiveChatId(chat.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                        activeChatId === chat.id ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(
                          chat.phone
                        )}`}
                      >
                        {avatarInitials(label)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{label}</p>
                        <p className="truncate text-xs text-gray-400">
                          {chat.lastMessagePreview ?? formatPhoneForDisplay(chat.phone)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex h-[calc(100vh-8rem)] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5">
            {activeChat ? (
              <>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(
                    activeChat.phone
                  )}`}
                >
                  {avatarInitials(activeChat.name ?? activeChat.phone)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {activeChat.name ?? formatPhoneForDisplay(activeChat.phone)}
                  </p>
                  <p className="text-xs text-gray-400">{formatPhoneForDisplay(activeChat.phone)}</p>
                </div>
              </>
            ) : (
              <p className="text-sm font-semibold text-gray-900">Select a chat</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 px-5 py-4">
            {!activeChat && (
              <p className="p-4 text-center text-sm text-gray-400">
                Select a chat on the left, or send a new message below to start one.
              </p>
            )}
            {activeChat && messagesLoading && (
              <p className="p-4 text-center text-sm text-gray-400">Loading…</p>
            )}
            {activeChat && !messagesLoading && messages.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-400">No messages yet.</p>
            )}
            {activeChat && !messagesLoading && messages.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {messages.map((m) => {
                  const isSent = m.direction === "outbound";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm ${
                          isSent
                            ? "rounded-br-md bg-blue-600 text-white"
                            : "rounded-bl-md border border-gray-100 bg-white text-gray-800"
                        }`}
                      >
                        {m.body}
                      </div>
                      <span className="mt-1 px-1 text-[10px] text-gray-400">
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-100 p-4">
            {!activeChat && (
              <input
                type="tel"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipient phone number..."
                className="mb-2 w-full rounded-full border border-gray-200 bg-slate-50 px-4 py-2 text-sm text-black outline-none transition focus:border-blue-300 focus:bg-white"
              />
            )}
            {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-black outline-none transition focus:border-blue-300 focus:bg-white"
              />
              <button
                type="submit"
                disabled={sending}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
              >
                {sending ? "…" : "➤"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
