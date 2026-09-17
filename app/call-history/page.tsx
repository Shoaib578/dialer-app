import { listRecentCalls } from "@/lib/signalwire";

export const dynamic = "force-dynamic";

function statusColor(status: string): string {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "in-progress" || status === "ringing") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default async function CallHistoryPage() {
  let calls: Awaited<ReturnType<typeof listRecentCalls>> = [];
  let loadError: string | null = null;

  try {
    calls = await listRecentCalls(50);
  } catch {
    loadError = "Couldn't load call history from SignalWire.";
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
                <th className="px-4 py-2 font-medium">Direction</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {calls.map((call) => (
                <tr key={call.sid}>
                  <td className="px-4 py-2 text-gray-900">{call.to}</td>
                  <td className="px-4 py-2 text-gray-500">{call.from}</td>
                  <td className="px-4 py-2 text-gray-500">{call.direction}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {formatDuration(call.durationSec)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${statusColor(
                        call.status
                      )}`}
                    >
                      {call.status}
                    </span>
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
