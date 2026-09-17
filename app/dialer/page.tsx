"use client";

import { useState } from "react";
import Keypad from "@/components/Keypad";
import CallControls from "@/components/CallControls";
import CallStatus from "@/components/CallStatus";
import ContactsPanel from "@/components/ContactsPanel";
import { useDialer } from "@/lib/useDialer";

const ACTIVE_PHASES = ["dialing", "ringing", "connected"];

export default function DialerPage() {
  const [number, setNumber] = useState("");
  const { phase, error, durationSec, placeCall, hangUp, reset } = useDialer();

  const inCall = ACTIVE_PHASES.includes(phase);

  const handleDigit = (digit: string) => {
    if (inCall) return;
    if (phase === "ended" || phase === "failed") reset();
    setNumber((n) => n + digit);
  };

  const handleBackspace = () => setNumber((n) => n.slice(0, -1));
  const handleClear = () => setNumber("");

  const handleCall = () => {
    if (!number) return;
    placeCall(number);
  };

  const handleContactCall = (phone: string) => {
    if (inCall) return;
    reset();
    setNumber(phone);
    placeCall(phone);
  };

  return (
    <div className="flex flex-1 justify-center bg-slate-100 px-4 py-8">
      <div className="flex w-full max-w-4xl flex-col items-start gap-4 md:flex-row md:justify-center">
        <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-md shadow-gray-200/60">
          <div className="text-center">
            <h2 className="text-base font-semibold text-gray-900">Manual Dialer</h2>
            <p className="mt-0.5 text-xs text-gray-400">Enter a number or pick a contact</p>
          </div>

          <input
            type="tel"
            value={number}
            disabled={inCall}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter phone number…"
            className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-center text-xl font-medium tracking-wide text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white disabled:opacity-60"
          />

          <CallStatus phase={phase} durationSec={durationSec} error={error} />

          <Keypad onDigit={handleDigit} disabled={inCall} />

          <div className="w-full">
            <CallControls
              phase={phase}
              canCall={number.length > 0 && !inCall}
              hasNumber={number.length > 0}
              onCall={handleCall}
              onHangUp={hangUp}
              onClear={handleClear}
              onBackspace={handleBackspace}
            />
          </div>
        </div>

        <ContactsPanel onCall={handleContactCall} callDisabled={inCall} />
      </div>
    </div>
  );
}
