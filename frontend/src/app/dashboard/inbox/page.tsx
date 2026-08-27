"use client";

import { useState, useEffect } from "react";

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

  if (loading) return <div className="p-8">Loading inbox...</div>;

  return (
    <div className="flex h-full border-t border-gray-200">
      {/* Sidebar for conversations list */}
      <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No conversations found.</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left p-4 hover:bg-blue-50 transition-colors ${selectedConv?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    Session {conv.session_id.substring(0, 8)}...
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    conv.status === 'escalated' ? 'bg-red-100 text-red-700' : 
                    conv.status === 'resolved' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {conv.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(conv.updated_at).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat view */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div>
                <h3 className="font-semibold text-gray-900">Session Details</h3>
                <p className="text-xs text-gray-500">ID: {selectedConv.session_id}</p>
              </div>
              {selectedConv.status !== 'resolved' && (
                <button 
                  onClick={handleResolve}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isAgent = msg.role === "agent";
                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                    <div className="text-xs text-gray-500 mb-1">{isUser ? "Customer" : isAgent ? "Human Agent" : "AI Bot"}</div>
                    <div className={`max-w-[75%] p-3 rounded-xl text-sm ${
                      isUser ? 'bg-white border border-gray-200 text-gray-800' : 
                      isAgent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              {selectedConv.status === 'resolved' ? (
                <div className="text-center text-sm text-gray-500 py-2">
                  This conversation has been resolved.
                </div>
              ) : (
                <form onSubmit={handleReply} className="flex space-x-2">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply to the customer..."
                    className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to view the history and reply.
          </div>
        )}
      </div>
    </div>
  );
}
