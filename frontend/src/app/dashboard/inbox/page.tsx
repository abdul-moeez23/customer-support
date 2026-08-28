"use client";

import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle, Clock, Send, User, Bot, AlertCircle } from "lucide-react";

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations?company_id=${companyId}`);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${conv.id}`);
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
    
    // Optimistic UI update
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "agent", content: text }]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${selectedConv.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text })
      });
      if (res.ok) {
        fetchConversations(); // refresh statuses
      }
    } catch (err) {
      console.error("Failed to send reply", err);
    }
  };

  const handleResolve = async () => {
    if (!selectedConv) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${selectedConv.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" })
      });
      fetchConversations();
      setSelectedConv(prev => ({ ...prev, status: "resolved" }));
    } catch (err) {
      console.error("Failed to resolve", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar for conversations list */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <div className="p-8 text-sm text-slate-500 text-center flex flex-col items-center gap-3">
              <CheckCircle className="w-8 h-8 text-slate-300" />
              <span>Inbox zero. Great job!</span>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left p-4 transition-colors relative group ${selectedConv?.id === conv.id ? 'bg-indigo-50' : 'hover:bg-slate-100 bg-white'}`}
              >
                {selectedConv?.id === conv.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold truncate ${selectedConv?.id === conv.id ? 'text-indigo-900' : 'text-slate-900'}`}>
                    Session {conv.session_id.substring(0, 8)}...
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                    conv.status === 'escalated' ? 'bg-red-100 text-red-700 border border-red-200' : 
                    conv.status === 'resolved' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {conv.status === 'escalated' && <AlertCircle className="w-3 h-3" />}
                    {conv.status === 'resolved' && <CheckCircle className="w-3 h-3" />}
                    {conv.status === 'active' && <Clock className="w-3 h-3" />}
                    {conv.status}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(conv.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat view */}
      <div className="flex-1 flex flex-col bg-white relative">
        {selectedConv ? (
          <>
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Session Details</h3>
                <p className="text-xs font-medium text-slate-500 font-mono mt-0.5">ID: {selectedConv.session_id}</p>
              </div>
              {selectedConv.status !== 'resolved' && (
                <button 
                  onClick={handleResolve}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors active:scale-[0.98] border border-slate-200"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Resolved
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isAgent = msg.role === "agent";
                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5 px-1">
                      {isUser && <User className="w-3.5 h-3.5" />}
                      {!isUser && isAgent && <MessageSquare className="w-3.5 h-3.5" />}
                      {!isUser && !isAgent && <Bot className="w-3.5 h-3.5" />}
                      <span>{isUser ? "Customer" : isAgent ? "Human Agent" : "AI Bot"}</span>
                    </div>
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isUser ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' : 
                      isAgent ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-200' : 'bg-slate-200 text-slate-800 rounded-tr-sm border border-slate-300'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              {selectedConv.status === 'resolved' ? (
                <div className="text-center text-sm font-medium text-slate-500 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                  This conversation has been resolved and closed.
                </div>
              ) : (
                <form onSubmit={handleReply} className="flex gap-3">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the customer..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                  <button 
                    type="submit"
                    disabled={!replyText.trim()}
                    className="flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 active:scale-[0.95] shadow-sm"
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-600">No conversation selected</p>
            <p className="text-sm font-medium mt-1">Select a conversation from the sidebar to view history and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
