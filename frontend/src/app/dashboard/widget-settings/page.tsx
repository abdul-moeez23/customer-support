"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, AlertCircle, LayoutTemplate, ChevronDown } from "lucide-react";

export default function WidgetSettingsPage() {
  const [config, setConfig] = useState<any>({
    bot_name: "Support Assistant",
    greeting_message: "👋 Hi! How can I help you today?",
    placeholder_text: "Type your message...",
    primary_color: "#4f46e5",
    text_color: "#ffffff",
    bg_color: "#ffffff",
    user_bubble_color: "#4f46e5",
    bot_bubble_color: "#f1f5f9",
    position: "bottom-right",
    show_branding: true,
    allow_attachments: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

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
    setMessage({ text: "", type: "" });

    const companyId = localStorage.getItem("company_id");
    try {
      const payload = { company_id: companyId, ...config };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/widget-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setMessage({ text: "Widget configuration saved successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to save configuration.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 flex flex-col xl:flex-row gap-8">
      
      {/* Form Settings */}
      <div className="flex-1 space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            Widget Customization
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Design your chat widget to perfectly match your brand.</p>
        </header>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bot Name</label>
                <input 
                  type="text" 
                  value={config.bot_name}
                  onChange={e => handleChange("bot_name", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Position</label>
                <div className="relative">
                  <select
                    value={config.position}
                    onChange={e => handleChange("position", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Greeting Message</label>
                <input 
                  type="text" 
                  value={config.greeting_message}
                  onChange={e => handleChange("greeting_message", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Input Placeholder text</label>
                <input 
                  type="text" 
                  value={config.placeholder_text}
                  onChange={e => handleChange("placeholder_text", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-indigo-500" />
                Color Palette
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Color (Header/Icon)</label>
                  <div className="relative flex items-center">
                    <input 
                      type="color" 
                      value={config.primary_color}
                      onChange={e => handleChange("primary_color", e.target.value)}
                      className="absolute left-3 w-6 h-6 opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute left-3 w-6 h-6 rounded-md border border-slate-200 shadow-sm pointer-events-none"
                      style={{ backgroundColor: config.primary_color }}
                    />
                    <input 
                      type="text" 
                      value={config.primary_color} 
                      onChange={e => handleChange("primary_color", e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Header Text Color</label>
                  <div className="relative flex items-center">
                    <input 
                      type="color" 
                      value={config.text_color}
                      onChange={e => handleChange("text_color", e.target.value)}
                      className="absolute left-3 w-6 h-6 opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute left-3 w-6 h-6 rounded-md border border-slate-200 shadow-sm pointer-events-none"
                      style={{ backgroundColor: config.text_color }}
                    />
                    <input 
                      type="text" 
                      value={config.text_color} 
                      onChange={e => handleChange("text_color", e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">User Bubble Color</label>
                  <div className="relative flex items-center">
                    <input 
                      type="color" 
                      value={config.user_bubble_color}
                      onChange={e => handleChange("user_bubble_color", e.target.value)}
                      className="absolute left-3 w-6 h-6 opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute left-3 w-6 h-6 rounded-md border border-slate-200 shadow-sm pointer-events-none"
                      style={{ backgroundColor: config.user_bubble_color }}
                    />
                    <input 
                      type="text" 
                      value={config.user_bubble_color} 
                      onChange={e => handleChange("user_bubble_color", e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bot Bubble Color</label>
                  <div className="relative flex items-center">
                    <input 
                      type="color" 
                      value={config.bot_bubble_color}
                      onChange={e => handleChange("bot_bubble_color", e.target.value)}
                      className="absolute left-3 w-6 h-6 opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute left-3 w-6 h-6 rounded-md border border-slate-200 shadow-sm pointer-events-none"
                      style={{ backgroundColor: config.bot_bubble_color }}
                    />
                    <input 
                      type="text" 
                      value={config.bot_bubble_color} 
                      onChange={e => handleChange("bot_bubble_color", e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={config.show_branding} 
                    onChange={e => handleChange("show_branding", e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer peer"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Show "Powered by Orchestrator" branding</span>
              </label>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl font-medium text-sm flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Widget Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Live Preview Area */}
      <div className="w-full xl:w-[380px] flex flex-col xl:pt-[104px]">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Live Preview</h3>
        <div 
          className="rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 border-[6px] border-slate-100 flex flex-col bg-white mx-auto w-full max-w-[360px]"
          style={{ height: '600px', backgroundColor: config.bg_color }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-5 flex-shrink-0 shadow-sm z-10" 
            style={{ backgroundColor: config.primary_color, color: config.text_color }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg shadow-inner">
                {config.bot_name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-base leading-tight">{config.bot_name}</div>
                <div className="flex items-center gap-1.5 text-xs font-medium opacity-90 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 border border-white/20 shadow-sm"></span> 
                  Usually replies instantly
                </div>
              </div>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto" style={{ backgroundColor: config.bg_color }}>
            <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm p-3.5 text-sm text-slate-800 shadow-sm border border-slate-100 font-medium leading-relaxed" style={{ backgroundColor: config.bot_bubble_color }}>
              {config.greeting_message}
            </div>
            <div className="self-end max-w-[85%] rounded-2xl rounded-tr-sm p-3.5 text-sm shadow-sm font-medium leading-relaxed" style={{ backgroundColor: config.user_bubble_color, color: config.text_color }}>
              I have a question about my account settings.
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2 flex-shrink-0 relative z-10">
            <input 
              type="text" 
              placeholder={config.placeholder_text}
              disabled
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-2.5 text-sm text-slate-500 font-medium cursor-not-allowed"
            />
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: config.primary_color, color: config.text_color }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </div>
          </div>

          {/* Branding */}
          {config.show_branding && (
            <div className="text-center text-[10px] font-bold text-slate-400 py-2.5 flex-shrink-0 border-t border-slate-50" style={{ backgroundColor: config.bg_color }}>
              Powered by Orchestrator
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
