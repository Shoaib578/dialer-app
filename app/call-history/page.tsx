import { listCallHistory } from "@/lib/callHistory";
import { formatPhoneForDisplay } from "@/lib/phone";

export const dynamic = "force-dynamic";

function statusColor(status: string): string {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "in-progress" || status === "ringing" || status === "queued" || status === "initiated") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-red-100 text-red-700";
}

function formatDuration(totalSeconds: number | null): string {
  const seconds = totalSeconds ?? 0;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export default async function CallHistoryPage() {
  let calls: Awaited<ReturnType<typeof listCallHistory>> = [];
  let loadError: string | null = null;

  try {
    calls = await listCallHistory(50);
  } catch {
    loadError = "Couldn't load call history.";
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Call History</h2>
        </div>

        {loadError && <p className="text-sm text-red-600 p-4">{loadError}</p>}
        {!loadError && calls.length === 0 && (
          <p className="text-sm text-gray-500 p-4">No calls yet.</p>
        )}

        {!loadError && calls.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-2 font-medium">To</th>
                <th className="px-4 py-2 font-medium">From</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {calls.map((call) => (
                <tr key={call.id}>
                  <td className="px-4 py-2 text-gray-900">{formatPhoneForDisplay(call.toNumber)}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {call.fromNumber ? formatPhoneForDisplay(call.fromNumber) : "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{formatDuration(call.durationSeconds)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${statusColor(call.status)}`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(call.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
