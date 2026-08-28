"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, AlertCircle, ChevronDown, Palette, Eye } from "lucide-react";

export default function WidgetSettingsPage() {
  const [config, setConfig] = useState<any>({
    bot_name: "Support Assistant",
    greeting_message: "Hi! How can I help you today?",
    placeholder_text: "Type your message...",
    primary_color: "#18181b",
    text_color: "#ffffff",
    bg_color: "#ffffff",
    user_bubble_color: "#18181b",
    bot_bubble_color: "#f4f4f5",
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
        setMessage({ text: "Widget configuration saved!", type: "success" });
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

  const inputClass = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all";

  const ColorInput = ({ label, field }: { label: string; field: string }) => (
    <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1.5">{label}</label>
      <div className="relative flex items-center">
        <input
          type="color"
          value={config[field]}
          onChange={e => handleChange(field, e.target.value)}
          className="absolute left-3 w-5 h-5 opacity-0 cursor-pointer z-10"
          aria-label={`Pick color for ${label}`}
        />
        <div
          className="absolute left-3 w-5 h-5 rounded border border-zinc-200 shadow-sm pointer-events-none"
          style={{ backgroundColor: config[field] }}
        />
        <input
          type="text"
          value={config[field]}
          onChange={e => handleChange(field, e.target.value)}
          className={inputClass + " pl-11 font-mono text-xs uppercase"}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-2 mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Settings className="w-5 h-5 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Widget Settings</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-7.5">Customize your chat widget to match your brand perfectly.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Settings form */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-5">
                {/* Content */}
                <div>
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Content</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="bot_name">Bot Name</label>
                      <input
                        id="bot_name"
                        type="text"
                        value={config.bot_name}
                        onChange={e => handleChange("bot_name", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="position">Position</label>
                      <div className="relative">
                        <select
                          id="position"
                          value={config.position}
                          onChange={e => handleChange("position", e.target.value)}
                          className={inputClass + " pr-10 appearance-none cursor-pointer"}
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="greeting">Greeting Message</label>
                    <input
                      id="greeting"
                      type="text"
                      value={config.greeting_message}
                      onChange={e => handleChange("greeting_message", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="placeholder">Input Placeholder</label>
                    <input
                      id="placeholder"
                      type="text"
                      value={config.placeholder_text}
                      onChange={e => handleChange("placeholder_text", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-3.5 h-3.5 text-zinc-400" />
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Colors</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Primary (Header)" field="primary_color" />
                    <ColorInput label="Header Text" field="text_color" />
                    <ColorInput label="User Bubble" field="user_bubble_color" />
                    <ColorInput label="Bot Bubble" field="bot_bubble_color" />
                  </div>
                </div>

                {/* Branding toggle */}
                <div className="pt-2 border-t border-zinc-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={config.show_branding}
                      onChange={e => handleChange("show_branding", e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                      aria-label="Show Powered by Orchestrator branding"
                    />
                    <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                      Show &ldquo;Powered by Orchestrator&rdquo; branding
                    </span>
                  </label>
                </div>

                {message.text && (
                  <div className={`flex items-start gap-2.5 text-sm p-3.5 rounded-lg border ${
                    message.type === "error"
                      ? "bg-red-50 border-red-100 text-red-700"
                      : "bg-emerald-50 border-emerald-100 text-emerald-700"
                  }`}>
                    {message.type === "error"
                      ? <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                      : <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
                    }
                    <span>{message.text}</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex justify-end rounded-b-xl">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Widget</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live preview */}
        <div className="w-full xl:w-[340px] flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Preview</p>
          </div>

          <div
            className="rounded-2xl overflow-hidden shadow-xl border-[5px] border-zinc-200 flex flex-col mx-auto"
            style={{ height: "520px", maxWidth: "320px", backgroundColor: config.bg_color }}
          >
            {/* Widget header */}
            <div
              className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
              style={{ backgroundColor: config.primary_color, color: config.text_color }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
                {config.bot_name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">{config.bot_name}</div>
                <div className="flex items-center gap-1.5 text-[11px] opacity-80 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto" style={{ backgroundColor: config.bg_color }}>
              <div
                className="self-start max-w-[80%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs leading-relaxed shadow-sm border border-zinc-100"
                style={{ backgroundColor: config.bot_bubble_color, color: "#3f3f46" }}
              >
                {config.greeting_message}
              </div>
              <div
                className="self-end max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs leading-relaxed shadow-sm"
                style={{ backgroundColor: config.user_bubble_color, color: config.text_color }}
              >
                How do I reset my password?
              </div>
              <div
                className="self-start max-w-[80%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs leading-relaxed shadow-sm border border-zinc-100"
                style={{ backgroundColor: config.bot_bubble_color, color: "#3f3f46" }}
              >
                Sure! Click &ldquo;Forgot Password&rdquo; on the login page.
              </div>
            </div>

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-zinc-100 flex gap-2 flex-shrink-0">
              <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2 text-[11px] text-zinc-400">
                {config.placeholder_text}
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: config.primary_color }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.text_color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>

            {/* Branding */}
            {config.show_branding && (
              <div className="text-center text-[9px] font-bold text-zinc-300 py-2 flex-shrink-0 border-t border-zinc-50" style={{ backgroundColor: config.bg_color }}>
                Powered by Orchestrator
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
