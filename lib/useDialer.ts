"use client";

import { useCallback, useRef, useState } from "react";
import { toE164 } from "./phone";

export type CallPhase =
  | "idle"
  | "dialing"
  | "ringing"
  | "connected"
  | "ended"
  | "failed";

const POLL_INTERVAL_MS = 1500;

function phaseFromStatus(status: string): CallPhase {
  switch (status) {
    case "queued":
    case "initiated":
      return "dialing";
    case "ringing":
      return "ringing";
    case "in-progress":
      return "connected";
    case "completed":
      return "ended";
    default:
      // busy, failed, no-answer, canceled
      return "failed";
  }
}

const TERMINAL_PHASES: CallPhase[] = ["ended", "failed"];

export function useDialer() {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const callSidRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const placeCall = useCallback(async (rawNumber: string) => {
    const to = toE164(rawNumber);
    if (!to) {
      setError("Enter a valid phone number.");
      setPhase("failed");
      return;
    }

    setError(null);
    setDurationSec(0);
    setPhase("dialing");

    try {
      const res = await fetch("/api/calls/dial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to start call.");
      }

      callSidRef.current = data.callSid;
      setPhase(phaseFromStatus(data.status));

      pollRef.current = setInterval(async () => {
        const sid = callSidRef.current;
        if (!sid) return;
        try {
          const statusRes = await fetch(`/api/calls/${sid}`);
          const statusData = await statusRes.json();
          if (!statusRes.ok) throw new Error(statusData?.error);

          const nextPhase = phaseFromStatus(statusData.status);
          setPhase(nextPhase);
          setDurationSec(statusData.durationSec ?? 0);

          if (TERMINAL_PHASES.includes(nextPhase)) {
            stopPolling();
          }
        } catch {
          // Transient poll failure — try again on the next tick.
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start call.");
      setPhase("failed");
    }
  }, []);

  const hangUp = useCallback(async () => {
    const sid = callSidRef.current;
    if (!sid) return;
    try {
      await fetch(`/api/calls/${sid}/hangup`, { method: "POST" });
    } catch {
      // Status polling will reflect the true end state regardless.
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    callSidRef.current = null;
    setPhase("idle");
    setError(null);
    setDurationSec(0);
  }, []);

  return {
    phase,
    error,
    durationSec,
    placeCall,
    hangUp,
    reset,
  };
}
