"use client";

import { useEffect, useState } from "react";
import type { MessageLogEntry } from "@/lib/signalwire";
import { toE164 } from "@/lib/phone";

function statusColor(status: string): string {
  if (status === "delivered" || status === "sent" || status === "received") {
    return "bg-green-100 text-green-700";
  }
  if (status === "queued" || status === "sending" || status === "accepted") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-red-100 text-red-700";
}

export default function MessagesPage() {
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const destination = toE164(to);
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
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-wrap items-start justify-center gap-4 p-4">
      <form
        onSubmit={handleSend}
        className="rounded-lg border border-gray-200 bg-white p-4 w-full max-w-sm flex flex-col gap-3"
      >
        <h2 className="text-sm font-semibold text-gray-900">Send a Message</h2>

        <input
          type="tel"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Recipient phone number..."
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message..."
          rows={4}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
        />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-40"
        >
          {sending ? "Sending…" : "💬 Send SMS"}
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white w-full max-w-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Messages</h2>
          <button
            type="button"
            onClick={loadMessages}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500 p-4">Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-gray-500 p-4">No messages yet.</p>
        )}
        {!loading && messages.length > 0 && (
          <ul className="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
            {messages.map((m) => (
              <li key={m.sid} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-900 font-medium">
                    {m.direction.startsWith("inbound") ? m.from : m.to}
                  </span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs ${statusColor(m.status)}`}
                  >
                    {m.status}
                  </span>
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
  );
}
