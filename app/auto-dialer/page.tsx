"use client";

import { useEffect, useRef, useState } from "react";
import CallStatus from "@/components/CallStatus";
import { CONTACTS } from "@/lib/contacts";
import { useDialer } from "@/lib/useDialer";

const TERMINAL_PHASES = ["ended", "failed"];

export default function AutoDialerPage() {
  const { phase, error, durationSec, placeCall, hangUp, reset } = useDialer();
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const runningRef = useRef(running);
  runningRef.current = running;

  const current = CONTACTS[index];

  useEffect(() => {
    if (!running) return;
    if (!TERMINAL_PHASES.includes(phase)) return;

    const next = index + 1;
    if (next >= CONTACTS.length) {
      setRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!runningRef.current) return;
      setIndex(next);
      reset();
      placeCall(CONTACTS[next].phone);
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, running]);

  const start = () => {
    if (CONTACTS.length === 0) return;
    setIndex(0);
    setRunning(true);
    reset();
    placeCall(CONTACTS[0].phone);
  };

  const stop = () => {
    setRunning(false);
    hangUp();
  };

  return (
    <div className="flex flex-1 justify-center p-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-900">Auto Dialer</h2>
        <p className="text-xs text-gray-500">
          Calls each contact in your list one at a time, moving to the next once a call ends.
        </p>

        {running && current && (
          <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
            <p className="text-sm text-gray-900 font-medium">
              Calling {index + 1} of {CONTACTS.length}: {current.name}
            </p>
            <p className="text-xs text-gray-500">{current.displayPhone}</p>
          </div>
        )}

        <CallStatus phase={phase} durationSec={durationSec} error={error} />

        <div className="flex gap-2">
          {running ? (
            <button
              type="button"
              onClick={stop}
              className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={CONTACTS.length === 0}
              className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              Start
            </button>
          )}
        </div>

        <ul className="divide-y divide-gray-100 border-t border-gray-100 pt-2">
          {CONTACTS.map((c, i) => (
            <li
              key={c.id}
              className={`py-2 text-sm flex justify-between ${
                running && i === index ? "text-blue-600 font-medium" : "text-gray-700"
              }`}
            >
              <span>{c.name}</span>
              <span className="text-gray-400">{c.displayPhone}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
