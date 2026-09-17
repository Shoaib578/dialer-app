"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

interface KeypadProps {
  onDigit: (digit: string) => void;
  disabled?: boolean;
}

export default function Keypad({ onDigit, disabled }: KeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {KEYS.map((digit) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(digit)}
          className="rounded-md border border-gray-200 bg-gray-50 py-3 text-base font-medium text-gray-800 hover:bg-gray-100 active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none"
        >
          {digit}
        </button>
      ))}
    </div>
  );
}
