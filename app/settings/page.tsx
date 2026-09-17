const ROWS: Array<{ label: string; value: string | undefined }> = [
  { label: "Caller ID number", value: process.env.SIGNALWIRE_PHONE_NUMBER },
  { label: "Agent phone number", value: process.env.AGENT_PHONE_NUMBER },
  { label: "SignalWire space", value: process.env.SIGNALWIRE_SPACE_URL },
  { label: "IVR enabled", value: process.env.ENABLE_IVR },
  { label: "Default agent extension", value: process.env.DEFAULT_AGENT_EXTENSION },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-1 justify-center p-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 w-full max-w-md">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Settings</h2>
        <p className="text-xs text-gray-500 mb-4">
          Read-only — sourced from this deployment&apos;s environment variables. Secrets
          (API tokens) are never shown here.
        </p>
        <dl className="divide-y divide-gray-100">
          {ROWS.map((row) => (
            <div key={row.label} className="py-2.5 flex items-center justify-between text-sm">
              <dt className="text-gray-500">{row.label}</dt>
              <dd className="text-gray-900 font-medium">{row.value ?? "Not set"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
