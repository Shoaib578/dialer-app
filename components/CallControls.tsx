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
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={inCall || !hasNumber}
        className="h-11 shrink-0 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
      >
        Clear
      </button>
      {inCall ? (
        <button
          type="button"
          onClick={onHangUp}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:bg-red-600 active:scale-[0.98]"
        >
          <span className="text-base">📞</span> End Call
        </button>
      ) : (
        <button
          type="button"
          onClick={onCall}
          disabled={!canCall}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-green-500 text-sm font-semibold text-white shadow-md shadow-green-200 transition hover:bg-green-600 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
        >
          <span className="text-base">📞</span> Call
        </button>
      )}
    </div>
  );
}
