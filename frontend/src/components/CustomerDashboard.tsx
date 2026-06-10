import React, { useState, useEffect } from "react";
import { CommentsSection } from "./CommentsSection";
import { api } from "../lib/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { PlusCircle, Loader2, Clock, CheckCircle, AlertCircle } from "lucide-react";

export function CustomerDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openTickets, setOpenTickets] = useState<Record<string, boolean>>({});

  const toggleTicket = (id: string) => {
    setOpenTickets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch only this customer's tickets on load
  const loadTickets = async () => {
    try {
      const data = await api.tickets.getAll();
      setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setLoading(true);

    try {
      await api.tickets.create({ title, description });
      setTitle("");
      setDescription("");
      await loadTickets(); // Refresh the history panel immediately
    } catch (err) {
      alert("Error generating ticket.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400";
      case "HIGH": return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400";
      default: return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {/* LEFT PANEL: Ticket Creation Form */}
      <div className="space-y-4 md:col-span-1">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-neutral-500" /> File a New Ticket
          </h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">Short Issue Title</label>
              <Input
                placeholder="e.g., Cannot process payments"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">Detailed Description</label>
              <textarea
                placeholder="Please describe exactly what happened..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-50"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Triaging with AI...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Dynamic Ticket History Grid */}
      <div className="md:col-span-2 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Your Support History</h2>
        {fetching ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center rounded-xl border border-dashed p-12 text-neutral-400">You haven't opened any support requests yet.</div>
        ) : (
          <div className="space-y-3">
            {/* CORRECTED TICKET MAPPER */}
            {tickets.map((ticket) => {
              const isOpen = !!openTickets[ticket.id]; // Check if this specific ticket is open
              return (
                <div key={ticket.id} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex cursor-pointer items-start justify-between" onClick={() => toggleTicket(ticket.id)}>
                    <div>
                      <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {ticket.category || "General"}
                      </span>
                      <h3 className="mt-1 text-base font-semibold text-neutral-900 hover:underline dark:text-neutral-50">{ticket.title}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">{ticket.description}</p>
                  
                  {/* Expandable Chat Workspace Toggle Button */}
                  <div className="pt-2">
                    <button 
                      onClick={() => toggleTicket(ticket.id)} 
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {isOpen ? "▲ Hide Messages" : `▼ View Conversation Thread (${ticket.comments?.length || 0})`}
                    </button>
                  </div>

                  {isOpen && (
                    <CommentsSection 
                      ticketId={ticket.id}
                      initialComments={ticket.comments || []}
                      onCommentAdded={loadTickets}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}