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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${DOT_COLOR[phase]}`} />
        <span className="text-sm text-gray-600">{LABELS[phase]}</span>
        {phase === "connected" && (
          <span className="text-xs tabular-nums text-gray-500">
            {formatDuration(durationSec)}
          </span>
        )}
      </div>
      {error && phase === "failed" && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
