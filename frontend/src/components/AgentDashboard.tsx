import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, ShieldAlert, Check, RefreshCw, UserPlus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { CommentsSection } from "./CommentsSection";

export function AgentDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const loadAllTickets = async () => {
    setFetching(true);
    try {
      // Pass all filters and pagination states to the API
      const params: any = { page, limit: 5 };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.tickets.getAll(params);
      
      setTickets(response.data);
      setTotalPages(response.meta.totalPages || 1);

      setSelectedTicket((currentSelected: any | null) => {
        if (currentSelected) {
          return response.data.find((t: any) => t.id === currentSelected.id) || currentSelected;
        }
        return null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  // Re-fetch whenever a filter or page changes
  useEffect(() => {
    loadAllTickets();
  }, [page, statusFilter, priorityFilter]);

  // Handle generic ticket updates (Status or Assignment)
  const handleTicketUpdate = async (id: string, payload: any) => {
    setUpdating(true);
    try {
      await api.tickets.update(id, payload);
      await loadAllTickets();
    } catch (err) {
      alert("Ticket update failed.");
    } finally {
      setUpdating(false);
    }
  };

  const executeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on new search
    loadAllTickets();
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* LEFT COLUMN: Main Queue List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Global Triage Queue</h2>
          <button onClick={loadAllTickets} className="text-neutral-400 hover:text-neutral-600"><RefreshCw className="h-4 w-4" /></button>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="space-y-2 bg-white p-3 rounded-xl border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
          <form onSubmit={executeSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input 
                placeholder="Search tickets..." 
                className="pl-9 h-9 text-sm" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">Go</Button>
          </form>
          <div className="flex gap-2">
            <select 
              className="h-9 flex-1 rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-xs dark:border-neutral-700 dark:text-neutral-300"
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select 
              className="h-9 flex-1 rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-xs dark:border-neutral-700 dark:text-neutral-300"
              value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {fetching ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>
        ) : (
          <div className="space-y-2">
            {tickets.length === 0 ? (
              <p className="text-center text-sm text-neutral-400 py-8">No tickets match criteria.</p>
            ) : (
              tickets.map((t) => (
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
                    <span className="font-mono text-[10px] uppercase font-bold text-neutral-500">{t.status}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.priority === "CRITICAL" || t.priority === "HIGH" ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-700"}`}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="font-medium text-neutral-900 dark:text-neutral-50 truncate">{t.title}</div>
                  <div className="text-xs text-neutral-400 mt-2 flex justify-between items-center">
                    <span className="truncate pr-2">{t.assignedTo ? `Agent: ${t.assignedTo.email}` : "Unassigned"}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
            
            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs text-neutral-500">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
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
              <div className="flex flex-wrap gap-2 justify-end">
                {/* ASSIGNMENT BUTTON */}
                {!selectedTicket.assignedToId && (
                  <Button onClick={() => handleTicketUpdate(selectedTicket.id, { assignedToId: currentUser.id })} variant="outline" disabled={updating} size="sm">
                    <UserPlus className="h-4 w-4 mr-1" /> Assign to Me
                  </Button>
                )}
                {/* STATUS BUTTONS */}
                {selectedTicket.status === "OPEN" && (
                  <Button onClick={() => handleTicketUpdate(selectedTicket.id, { status: "IN_PROGRESS" })} variant="secondary" disabled={updating} size="sm">
                    Start Progress
                  </Button>
                )}
                {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                  <Button onClick={() => handleTicketUpdate(selectedTicket.id, { status: "RESOLVED" })} disabled={updating} size="sm">
                    <Check className="h-4 w-4 mr-1" /> Resolve
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">User Description</h4>
              <p className="text-sm text-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border dark:text-neutral-300 whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

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
                <span className="block text-xs text-neutral-400 font-medium mb-1">AI Drafted Reply</span>
                <p className="text-xs italic bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 p-3 rounded-lg border border-blue-100 dark:border-neutral-800 whitespace-pre-wrap leading-relaxed">
                  "{selectedTicket.suggestedResponse}"
                </p>
              </div>
            </div>

            <CommentsSection 
              ticketId={selectedTicket.id}
              initialComments={selectedTicket.comments || []}
              onCommentAdded={loadAllTickets}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-neutral-200 p-12 text-center text-neutral-400 dark:border-neutral-800">
            Select a support ticket to review AI diagnostics and manage the thread.
          </div>
        )}
      </div>
    </div>
  );
}