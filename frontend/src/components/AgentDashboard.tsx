import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Loader2, ShieldAlert, Check, RefreshCw } from "lucide-react";

export function AgentDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadAllTickets = async () => {
    try {
      const data = await api.tickets.getAll();
      setTickets(data);
      if (selectedTicket) {
        const freshSelected = data.find((t: any) => t.id === selectedTicket.id);
        if (freshSelected) setSelectedTicket(freshSelected);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadAllTickets();
  }, []);

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    setUpdating(true);
    try {
      await api.tickets.update(id, { status: nextStatus });
      await loadAllTickets();
    } catch (err) {
      alert("Status change failed.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* LEFT COLUMN: Main Queue List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Global Triage Queue</h2>
          <button onClick={loadAllTickets} className="text-neutral-400 hover:text-neutral-600"><RefreshCw className="h-4 w-4" /></button>
        </div>
        {fetching ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`w-full text-left p-4 rounded-xl border transition-all text-sm block ${
                  selectedTicket?.id === t.id
                    ? "border-neutral-900 bg-neutral-50 shadow-sm dark:border-neutral-50 dark:bg-neutral-800/50"
                    : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-neutral-400">{t.category || "General"}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.priority === "CRITICAL" || t.priority === "HIGH" ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-700"}`}>
                    {t.priority}
                  </span>
                </div>
                <div className="font-medium text-neutral-900 dark:text-neutral-50 truncate">{t.title}</div>
                <div className="text-xs text-neutral-400 mt-2 flex justify-between items-center">
                  <span>From: {t.createdBy?.email}</span>
                  <span className="font-semibold">{t.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: AI Evaluation Workspace */}
      <div className="lg:col-span-2">
        {selectedTicket ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
            <div className="flex justify-between items-start border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{selectedTicket.title}</h3>
                <p className="text-xs text-neutral-400 mt-1">Submitted by: {selectedTicket.createdBy?.email}</p>
              </div>
              <div className="flex gap-2">
                {selectedTicket.status === "OPEN" ? (
                  <Button onClick={() => handleUpdateStatus(selectedTicket.id, "RESOLVED")} disabled={updating} size="sm">
                    <Check className="h-4 w-4 mr-1" /> Mark Resolved
                  </Button>
                ) : (
                  <Button onClick={() => handleUpdateStatus(selectedTicket.id, "OPEN")} variant="outline" disabled={updating} size="sm">
                    Reopen Ticket
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">User Description</h4>
              <p className="text-sm text-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border dark:text-neutral-300 whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            {/* AI AUTO-TRIAGE GENERATIONS BLOCK */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20 space-y-4">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-semibold text-sm">
                <ShieldAlert className="h-4 w-4" /> AI Copilot Coping Engine
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-neutral-400 font-medium mb-1">Determined Category</span>
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{selectedTicket.category}</span>
                </div>
                <div>
                  <span className="block text-neutral-400 font-medium mb-1">Evaluated Priority</span>
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{selectedTicket.priority}</span>
                </div>
              </div>
              <div>
                <span className="block text-xs text-neutral-400 font-medium mb-1">AI Generated Suggested Response Draft</span>
                <p className="text-xs italic bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 p-3 rounded-lg border border-blue-100 dark:border-neutral-800 whitespace-pre-wrap leading-relaxed">
                  "{selectedTicket.suggestedResponse}"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-neutral-200 p-12 text-center text-neutral-400 dark:border-neutral-800">
            Select a support ticket from the queue to review AI diagnostic triage details.
          </div>
        )}
      </div>
    </div>
  );
}