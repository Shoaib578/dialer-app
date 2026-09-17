"use client";

import type { CallPhase } from "@/lib/useDialer";

interface CallControlsProps {
  phase: CallPhase;
  canCall: boolean;
  hasNumber: boolean;
  onCall: () => void;
  onHangUp: () => void;
  onClear: () => void;
  onBackspace: () => void;
}

const IN_CALL_PHASES: CallPhase[] = ["dialing", "ringing", "connected"];

export default function CallControls({
  phase,
  canCall,
  hasNumber,
  onCall,
  onHangUp,
  onClear,
  onBackspace,
}: CallControlsProps) {
  const inCall = IN_CALL_PHASES.includes(phase);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBackspace}
        disabled={inCall || !hasNumber}
        aria-label="Backspace"
        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={inCall || !hasNumber}
        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
      >
        Clear
      </button>
      {inCall ? (
        <button
          type="button"
          onClick={onHangUp}
          className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
        >
          📞 End Call
        </button>
      ) : (
        <button
          type="button"
          onClick={onCall}
          disabled={!canCall}
          className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-40 disabled:pointer-events-none"
        >
          📞 Direct PSTN Call
        </button>
      )}
    </div>
  );
}
