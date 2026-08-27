"use client";

import { useState, useEffect } from "react";

export default function WidgetSettingsPage() {
  const [config, setConfig] = useState<any>({
    bot_name: "Support Assistant",
    greeting_message: "👋 Hi! How can I help you today?",
    placeholder_text: "Type your message...",
    primary_color: "#2563eb",
    text_color: "#ffffff",
    bg_color: "#ffffff",
    user_bubble_color: "#2563eb",
    bot_bubble_color: "#f3f4f6",
    position: "bottom-right",
    show_branding: true,
    allow_attachments: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/widget-config/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load widget config", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const companyId = localStorage.getItem("company_id");
    try {
      const payload = { company_id: companyId, ...config };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/widget-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setMessage("Widget configuration saved successfully!");
      } else {
        setMessage("Failed to save configuration.");
      }
    } catch (err) {
      console.error(err);
      setMessage("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 flex gap-8">
      
      {/* Form Settings */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Widget Settings</h1>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
                <input 
                  type="text" 
                  value={config.bot_name}
                  onChange={e => handleChange("bot_name", e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select 
                  value={config.position} 
                  onChange={e => handleChange("position", e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Greeting Message</label>
              <input 
                type="text" 
                value={config.greeting_message}
                onChange={e => handleChange("greeting_message", e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input Placeholder text</label>
              <input 
                type="text" 
                value={config.placeholder_text}
                onChange={e => handleChange("placeholder_text", e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color (Header/Bubble)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={config.primary_color}
                    onChange={e => handleChange("primary_color", e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input type="text" value={config.primary_color} onChange={e => handleChange("primary_color", e.target.value)} className="flex-1 border border-gray-300 rounded-md p-2 uppercase text-sm"/>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Text Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={config.text_color}
                    onChange={e => handleChange("text_color", e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input type="text" value={config.text_color} onChange={e => handleChange("text_color", e.target.value)} className="flex-1 border border-gray-300 rounded-md p-2 uppercase text-sm"/>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Bubble Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={config.user_bubble_color}
                    onChange={e => handleChange("user_bubble_color", e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input type="text" value={config.user_bubble_color} onChange={e => handleChange("user_bubble_color", e.target.value)} className="flex-1 border border-gray-300 rounded-md p-2 uppercase text-sm"/>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bot Bubble Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={config.bot_bubble_color}
                    onChange={e => handleChange("bot_bubble_color", e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input type="text" value={config.bot_bubble_color} onChange={e => handleChange("bot_bubble_color", e.target.value)} className="flex-1 border border-gray-300 rounded-md p-2 uppercase text-sm"/>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={config.show_branding} 
                  onChange={e => handleChange("show_branding", e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Show "Powered by AI Support" branding</span>
              </label>
            </div>

            {message && (
              <div className={`p-3 text-sm rounded ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button 
                type="submit" 
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Widget Settings"}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Live Preview Area */}
      <div className="w-[360px] flex flex-col pt-[72px]">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Live Preview</h3>
        <div 
          className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col"
          style={{ height: '520px', backgroundColor: config.bg_color }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 flex-shrink-0" 
            style={{ backgroundColor: config.primary_color, color: config.text_color }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center font-bold text-sm">
                {config.bot_name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm">{config.bot_name}</div>
                <div className="flex items-center gap-1.5 text-xs opacity-90 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Online
                </div>
              </div>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto" style={{ backgroundColor: config.bg_color }}>
            <div className="self-start max-w-[80%] rounded-2xl rounded-bl-sm p-3 text-sm text-gray-800" style={{ backgroundColor: config.bot_bubble_color }}>
              {config.greeting_message}
            </div>
            <div className="self-end max-w-[80%] rounded-2xl rounded-br-sm p-3 text-sm" style={{ backgroundColor: config.user_bubble_color, color: config.text_color }}>
              I have a question about my account.
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0" style={{ backgroundColor: config.bg_color }}>
            <input 
              type="text" 
              placeholder={config.placeholder_text}
              disabled
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-500"
            />
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 opacity-80"
              style={{ backgroundColor: config.primary_color, color: config.text_color }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </div>
          </div>

          {/* Branding */}
          {config.show_branding && (
            <div className="text-center text-[11px] text-gray-400 pb-2 flex-shrink-0" style={{ backgroundColor: config.bg_color }}>
              Powered by AI Support
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
