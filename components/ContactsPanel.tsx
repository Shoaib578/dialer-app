"use client";

import { useEffect, useRef, useState } from "react";
import type { Contact } from "@/lib/contacts";
import { formatPhoneForDisplay, toE164 } from "@/lib/phone";

interface ContactsPanelProps {
  onCall: (phone: string) => void;
  callDisabled?: boolean;
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(name: string): string {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ContactsPanel({ onCall, callDisabled }: ContactsPanelProps) {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (res.ok) setContacts(data.contacts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const phone = toE164(newPhone);
    if (!newName.trim()) {
      setAddError("Name is required.");
      return;
    }
    if (!phone) {
      setAddError("Enter a valid phone number.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to add contact.");

      setNewName("");
      setNewPhone("");
      await loadContacts();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add contact.");
    } finally {
      setAdding(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setImportMessage(null);
    setImportError(null);
    setImporting(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/contacts/import", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to import contacts.");

      const parts = [`${data.created} added`, `${data.updated} updated`];
      if (data.errors?.length) parts.push(`${data.errors.length} skipped`);
      setImportMessage(parts.join(", ") + ".");
      await loadContacts();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import contacts.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex h-full w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-md shadow-gray-200/60">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Contacts</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            {contacts.length}
          </span>
          <button
            type="button"
            onClick={handleImportClick}
            disabled={importing}
            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            {importing ? "Importing…" : "Import"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {importMessage && <p className="mb-2 text-xs text-green-600">{importMessage}</p>}
      {importError && <p className="mb-2 text-xs text-red-500">{importError}</p>}

      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          ⌕
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full rounded-full border border-gray-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-300 focus:bg-white"
        />
      </div>

      <form onSubmit={handleAddContact} className="mb-3 flex flex-col gap-2 rounded-xl bg-slate-100 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-blue-300"
          />
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone number"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-blue-300"
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="self-start rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
        >
          + Add contact
        </button>
        {addError && <p className="text-xs text-red-500">{addError}</p>}
      </form>

      <div className="flex-1 overflow-y-auto">
        {loading && <p className="py-6 text-center text-sm text-gray-400">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No contacts yet.</p>
        )}

        <ul className="divide-y divide-gray-100">
          {filtered.map((contact) => (
            <li key={contact.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(
                    contact.name
                  )}`}
                >
                  {initials(contact.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{contact.name}</p>
                  <p className="truncate text-xs text-gray-400">
                    {formatPhoneForDisplay(contact.phone)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCall(contact.phone)}
                disabled={callDisabled}
                aria-label={`Call ${contact.name}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm text-white shadow-sm transition hover:bg-green-600 disabled:opacity-40 disabled:pointer-events-none"
              >
                📞
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
