"use client";

const KEYS: Array<{ digit: string; letters?: string }> = [
  { digit: "1" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*" },
  { digit: "0", letters: "+" },
  { digit: "#" },
];

interface KeypadProps {
  onDigit: (digit: string) => void;
  disabled?: boolean;
}

export default function Keypad({ onDigit, disabled }: KeypadProps) {
  return (
    <div className="grid w-full max-w-[15rem] grid-cols-3 gap-2">
      {KEYS.map(({ digit, letters }) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(digit)}
          className="group flex aspect-square flex-col items-center justify-center rounded-full border border-gray-200 bg-slate-50 text-gray-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          <span className="text-lg font-semibold leading-none">{digit}</span>
          <span className="mt-1 text-[8px] font-medium tracking-wide text-gray-400 group-hover:text-blue-400">
            {letters ?? " "}
          </span>
        </button>
      ))}
    </div>
  );
}
