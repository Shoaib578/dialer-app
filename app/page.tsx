import Link from "next/link";
import { listCallHistory } from "@/lib/callHistory";
import { formatPhoneForDisplay } from "@/lib/phone";

export const dynamic = "force-dynamic";

function statusColor(status: string): string {
  if (status === "completed") return "text-green-600";
  if (status === "in-progress" || status === "ringing") return "text-amber-600";
  return "text-red-600";
}

export default async function OmniDialerPage() {
  let calls: Awaited<ReturnType<typeof listCallHistory>> = [];
  let loadError: string | null = null;

  try {
    calls = await listCallHistory(5);
  } catch {
    loadError = "Couldn't load recent call activity.";
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dialer"
          className="rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 transition"
        >
          <p className="text-sm font-semibold text-gray-900">📞 Manual Dialer</p>
          <p className="text-xs text-gray-500 mt-1">Dial a number by hand</p>
        </Link>
        <Link
          href="/call-history"
          className="rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 transition"
        >
          <p className="text-sm font-semibold text-gray-900">🗒️ Call History</p>
          <p className="text-xs text-gray-500 mt-1">See every past call</p>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {!loadError && calls.length === 0 && (
          <p className="text-sm text-gray-500">No calls yet.</p>
        )}
        {!loadError && calls.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {calls.map((call) => (
              <li key={call.id} className="py-2 flex items-center justify-between text-sm">
                <span className="text-gray-900">{formatPhoneForDisplay(call.toNumber)}</span>
                <span className={statusColor(call.status)}>{call.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
