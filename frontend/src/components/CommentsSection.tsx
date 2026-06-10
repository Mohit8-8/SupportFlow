import React, { useState } from "react";
import { api } from "../lib/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send, Loader2 } from "lucide-react";

interface CommentsSectionProps {
  ticketId: string;
  initialComments: any[];
  onCommentAdded: () => void;
}

export function CommentsSection({
  ticketId,
  initialComments,
  onCommentAdded,
}: CommentsSectionProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    try {
      await api.comments.add(ticketId, content);
      setContent("");
      onCommentAdded();
    } catch (err: any) {
      // FIX: Force the browser to show us the actual internal JavaScript error!
      console.error("Local Crash:", err);
      alert(`System Error: ${err.message || String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
        Conversation Thread
      </h4>

      {/* Messages Timeline */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {initialComments.length === 0 ? (
          <p className="text-xs italic text-neutral-400">
            No messages in this thread yet.
          </p>
        ) : (
          initialComments.map((comment: any) => {
            const isAgent = comment.author?.role === "AGENT";
            return (
              <div
                key={comment.id}
                className={`p-3 rounded-lg text-sm max-w-[85%] ${
                  isAgent
                    ? "bg-blue-50 text-blue-950 border border-blue-100 ml-auto dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50"
                    : "bg-neutral-50 text-neutral-800 border border-neutral-100 dark:bg-neutral-800/40 dark:text-neutral-300 dark:border-neutral-700/50"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[11px] font-medium text-neutral-400">
                  <span>{comment.author?.email}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wide bg-white/80 px-1 rounded dark:bg-neutral-900">
                    {comment.author?.role}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Box Form */}
      <form onSubmit={handleSendComment} className="flex gap-2">
        <Input
          placeholder="Type a message or updates..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
