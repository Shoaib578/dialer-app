"use client";

import type { CallPhase } from "@/lib/useDialer";

const LABELS: Record<CallPhase, string> = {
  idle: "Ready to call",
  dialing: "Calling customer…",
  ringing: "Ringing…",
  connected: "Connected — bridging your phone",
  ended: "Call ended",
  failed: "Call failed",
};

const BADGE_STYLE: Record<CallPhase, string> = {
  idle: "bg-gray-100 text-gray-500",
  dialing: "bg-amber-50 text-amber-600",
  ringing: "bg-amber-50 text-amber-600",
  connected: "bg-green-50 text-green-600",
  ended: "bg-gray-100 text-gray-500",
  failed: "bg-red-50 text-red-600",
};

const DOT_COLOR: Record<CallPhase, string> = {
  idle: "bg-gray-300",
  dialing: "bg-amber-500 animate-pulse",
  ringing: "bg-amber-500 animate-pulse",
  connected: "bg-green-500",
  ended: "bg-gray-300",
  failed: "bg-red-500",
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface CallStatusProps {
  phase: CallPhase;
  durationSec: number;
  error: string | null;
}

export default function CallStatus({ phase, durationSec, error }: CallStatusProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${BADGE_STYLE[phase]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[phase]}`} />
        {LABELS[phase]}
        {phase === "connected" && (
          <span className="tabular-nums">{formatDuration(durationSec)}</span>
        )}
      </div>
      {error && phase === "failed" && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
