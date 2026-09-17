"use client";

import { useEffect, useState } from "react";
import type { Chat, Message } from "@/lib/messages";
import { formatPhoneForDisplay, toE164 } from "@/lib/phone";

function statusColor(status: string | null): string {
  if (status === "delivered" || status === "sent" || status === "received") {
    return "bg-green-100 text-green-700";
  }
  if (status === "queued" || status === "sending" || status === "accepted") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-red-100 text-red-700";
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

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (activeChatId !== null) loadMessages(activeChatId);
  }, [activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

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
      const chat = chats.find((c) => c.phone === destination);
      if (chat) await loadMessages(chat.id);
      else await loadChats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-1 gap-4 p-4">
      <div className="rounded-lg border border-gray-200 bg-white w-full max-w-xs overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Chats</h2>
          <button
            type="button"
            onClick={loadChats}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>

        {chatsLoading && <p className="text-sm text-gray-500 p-4">Loading…</p>}
        {!chatsLoading && chats.length === 0 && (
          <p className="text-sm text-gray-500 p-4">No chats yet.</p>
        )}
        <ul className="divide-y divide-gray-100 overflow-y-auto">
          {chats.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${
                  activeChatId === chat.id ? "bg-blue-50" : ""
                }`}
              >
                <p className="text-gray-900 font-medium">
                  {chat.name ?? formatPhoneForDisplay(chat.phone)}
                </p>
                {chat.name && (
                  <p className="text-xs text-gray-500">{formatPhoneForDisplay(chat.phone)}</p>
                )}
                {chat.lastMessagePreview && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {chat.lastMessagePreview}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="rounded-lg border border-gray-200 bg-white flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              {activeChat ? activeChat.name ?? formatPhoneForDisplay(activeChat.phone) : "Select a chat"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!activeChat && (
              <p className="text-sm text-gray-500 p-4">
                Select a chat on the left, or send a new message below to start one.
              </p>
            )}
            {activeChat && messagesLoading && <p className="text-sm text-gray-500 p-4">Loading…</p>}
            {activeChat && !messagesLoading && messages.length === 0 && (
              <p className="text-sm text-gray-500 p-4">No messages yet.</p>
            )}
            {activeChat && !messagesLoading && messages.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {messages.map((m) => (
                  <li key={m.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-900 font-medium">
                        {m.direction === "inbound" ? "Received" : "Sent"}
                      </span>
                      {m.status && (
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-xs ${statusColor(m.status)}`}
                        >
                          {m.status}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1 break-words">{m.body}</p>
                    {m.errorMessage && (
                      <p className="text-xs text-red-500 mt-1">{m.errorMessage}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSend}
          className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-3"
        >
          <h2 className="text-sm font-semibold text-gray-900">
            {activeChat ? "Send a message" : "Start a new chat"}
          </h2>

          {!activeChat && (
            <input
              type="tel"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipient phone number..."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message..."
            rows={3}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-40 self-start"
          >
            {sending ? "Sending…" : "💬 Send SMS"}
          </button>
        </form>
      </div>
    </div>
  );
}
