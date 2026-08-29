"use client";

import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle, Clock, Send, User, Bot, AlertCircle, Inbox } from "lucide-react";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/conversations?company_id=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedConv(conv);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/conversations/${conv.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    const text = replyText;
    setReplyText("");

    setMessages(prev => [...prev, { id: Date.now().toString(), role: "agent", content: text }]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/conversations/${selectedConv.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text })
      });
      if (res.ok) {
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to send reply", err);
    }
  };

  const handleResolve = async () => {
    if (!selectedConv) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/conversations/${selectedConv.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" })
      });
      fetchConversations();
      setSelectedConv((prev: any) => ({ ...prev, status: "resolved" }));
    } catch (err) {
      console.error("Failed to resolve", err);
    }
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    escalated: { label: "Escalated", className: "bg-red-50 text-red-700 border-red-200" },
    resolved: { label: "Resolved", className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
    active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-zinc-50">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-zinc-200 flex flex-col bg-white">
        <div className="px-4 py-3.5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900">Conversations</h2>
          </div>
          {conversations.length > 0 && (
            <span className="text-[11px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{conversations.length}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5 text-zinc-300" />
              </div>
              <p className="text-sm font-semibold text-zinc-600">All caught up!</p>
              <p className="text-xs text-zinc-400 mt-1">No conversations yet.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isSelected = selectedConv?.id === conv.id;
              const status = statusConfig[conv.status] || statusConfig.active;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-4 py-3.5 border-b border-zinc-100 transition-colors relative cursor-pointer ${
                    isSelected ? "bg-zinc-50" : "hover:bg-zinc-50/80"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-zinc-800" />}
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-xs font-bold text-zinc-900 truncate">
                      Session {conv.session_id.substring(0, 8)}...
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border flex-shrink-0 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.updated_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat view */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConv ? (
          <>
            {/* Chat header */}
            <div className="px-6 py-3.5 border-b border-zinc-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Session Details</h3>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{selectedConv.session_id}</p>
              </div>
              {selectedConv.status !== "resolved" && (
                <button
                  onClick={handleResolve}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-lg transition-colors border border-zinc-200 hover:border-zinc-300 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark Resolved
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-zinc-50/50">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isAgent = msg.role === "agent";
                return (
                  <div key={idx} className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 mb-1.5 px-1">
                      {isUser && <User className="w-3 h-3" />}
                      {!isUser && isAgent && <MessageSquare className="w-3 h-3" />}
                      {!isUser && !isAgent && <Bot className="w-3 h-3" />}
                      <span>{isUser ? "Customer" : isAgent ? "Human Agent" : "AI Bot"}</span>
                    </div>
                    <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? "bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm"
                        : isAgent
                        ? "bg-zinc-900 text-white rounded-tr-sm"
                        : "bg-zinc-100 text-zinc-700 rounded-tr-sm border border-zinc-200"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply bar */}
            <div className="px-5 py-4 bg-white border-t border-zinc-100">
              {selectedConv.status === "resolved" ? (
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 py-2">
                  <CheckCircle className="w-4 h-4 text-zinc-300" />
                  This conversation is resolved and closed.
                </div>
              ) : (
                <form onSubmit={handleReply} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply to customer..."
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
                    aria-label="Reply message"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="flex items-center justify-center w-10 h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all disabled:opacity-40 active:scale-[0.95] cursor-pointer flex-shrink-0"
                    aria-label="Send reply"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-sm font-bold text-zinc-600">No conversation selected</p>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-xs">Pick a conversation from the list to view the message history and send replies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
