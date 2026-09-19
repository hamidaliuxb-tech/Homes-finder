import React, { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/my/notifications").then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const markAll = async () => { await api.post("/my/notifications/read-all"); load(); };

  return (
    <div data-testid="notifications-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Notifications</h1>
        {items.length > 0 && <Button variant="outline" onClick={markAll} data-testid="mark-all-read">Mark all read</Button>}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {items.length === 0 ? <p className="p-8 text-center text-slate-500">No notifications yet.</p> :
          items.map((n) => (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${n.read ? "" : "bg-amber-50/40"}`} data-testid={`note-${n.id}`}>
              <span className="text-lg">🔔</span>
              <div><p className="text-sm text-slate-800">{n.message}</p><span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</span></div>
            </div>
          ))}
      </div>
    </div>
  );
}
