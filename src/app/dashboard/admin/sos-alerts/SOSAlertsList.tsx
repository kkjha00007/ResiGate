"use client";
import { useState } from "react";
import { format } from "date-fns";
import type { SOSAlert } from "@/lib/types";

export default function SOSAlertsList({ alerts: initialAlerts }: { alerts: SOSAlert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [comment, setComment] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (id: string, status: "acknowledged" | "resolved") => {
    setLoading(id + status);
    await fetch(`/api/sos/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment: comment[id] || "" }),
    });
    // Refetch the updated alert from backend
    const res = await fetch(`/api/sos/${id}`);
    if (res.ok) {
      const updatedAlert = await res.json();
      setAlerts((alerts) =>
        alerts.map((alert) => (alert.id === id ? updatedAlert : alert))
      );
    }
    setComment((c) => ({ ...c, [id]: "" }));
    setLoading(null);
  };

  if (!alerts.length) return <div className="text-muted-foreground">No SOS alerts found.</div>;

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="border rounded-xl p-4 bg-red-50 dark:bg-red-900/30 shadow hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 mb-2">
            <span className="font-bold text-red-700 dark:text-red-300 text-base truncate max-w-[180px] sm:max-w-[200px]">{alert.userName}</span>
            <span className="text-xs text-muted-foreground">Flat {alert.flatNumber}</span>
            <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{format(new Date(alert.createdAt), "PPpp")}</span>
          </div>
          <div className="mb-2 max-w-full overflow-x-auto">
            <span className="block text-sm text-slate-900 dark:text-slate-100 break-words whitespace-pre-line max-h-32 overflow-y-auto pr-2">
              {alert.message || <span className="italic text-muted-foreground">No message</span>}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${alert.status === "active" ? "bg-red-600 text-white" : alert.status === "acknowledged" ? "bg-yellow-400 text-black" : "bg-green-600 text-white"}`}>{alert.status}</span>
            <input
              type="text"
              className="border rounded px-2 py-1 text-xs w-48 max-w-full"
              placeholder="Add comment (optional)"
              value={comment[alert.id] || ""}
              onChange={e => setComment(c => ({ ...c, [alert.id]: e.target.value }))}
              disabled={loading !== null}
            />
            {alert.status === "active" && (
              <button onClick={() => updateStatus(alert.id, "acknowledged")} className="px-2 py-1 rounded bg-yellow-400 text-black text-xs font-semibold" disabled={loading !== null}>{loading === alert.id + "acknowledged" ? "Saving..." : "Acknowledge"}</button>
            )}
            {alert.status !== "resolved" && (
              <button onClick={() => updateStatus(alert.id, "resolved")} className="px-2 py-1 rounded bg-green-600 text-white text-xs font-semibold" disabled={loading !== null}>{loading === alert.id + "resolved" ? "Saving..." : "Resolve"}</button>
            )}
          </div>
          {(alert.comments ?? []).length > 0 && (
            <div className="mt-2 bg-white/80 dark:bg-slate-800 rounded p-2 text-xs max-h-32 overflow-y-auto">
              <div className="font-semibold mb-1 text-slate-700 dark:text-slate-200">Comments:</div>
              <ul className="space-y-1">
                {(alert.comments ?? []).map((c, idx) => (
                  <li key={idx} className="border-l-2 pl-2 border-red-400 break-words">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{c.by}</span> <span className="text-slate-500">({c.byRole})</span>: {c.comment} <span className="text-slate-400">[{format(new Date(c.createdAt), 'PPpp')}]</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
