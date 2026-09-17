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
    <div className="flex flex-1 flex-wrap items-start justify-center gap-4 p-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 w-full max-w-sm flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Manual Dialer</h2>

        <input
          type="tel"
          value={number}
          disabled={inCall}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Enter phone number..."
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-center text-base text-gray-900 outline-none focus:border-blue-400 disabled:opacity-60"
        />

        <CallStatus phase={phase} durationSec={durationSec} error={error} />

        <Keypad onDigit={handleDigit} disabled={inCall} />

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

      <ContactsPanel onCall={handleContactCall} callDisabled={inCall} />
    </div>
  );
}
