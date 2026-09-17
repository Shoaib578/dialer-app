"use client";

import { useState } from "react";
import { CONTACTS } from "@/lib/contacts";

interface ContactsPanelProps {
  onCall: (phone: string) => void;
  callDisabled?: boolean;
}

export default function ContactsPanel({ onCall, callDisabled }: ContactsPanelProps) {
  const [query, setQuery] = useState("");

  const filtered = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 w-full max-w-sm">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Contacts</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts..."
          className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
        />
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Search
        </button>
      </div>

      <ul className="divide-y divide-gray-100">
        {filtered.map((contact) => (
          <li key={contact.id} className="py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{contact.name}</p>
              <p className="text-xs text-gray-500">{contact.displayPhone}</p>
              <span className="inline-block mt-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                {contact.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onCall(contact.phone)}
                disabled={callDisabled}
                className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40 disabled:pointer-events-none"
              >
                Call
              </button>
              <button
                type="button"
                disabled
                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-400"
              >
                Audio Call
              </button>
              <button
                type="button"
                disabled
                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-400"
              >
                Video Call
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
