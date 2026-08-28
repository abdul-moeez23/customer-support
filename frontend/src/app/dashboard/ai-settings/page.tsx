"use client";

import { useState, useEffect } from "react";
import { Bot, Save, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

export default function AISettingsPage() {
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/llm-config/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider);
        setModel(data.model || "");
        setHasApiKey(data.has_api_key);
      }
    } catch (err) {
      console.error("Failed to load AI config", err);
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
      const payload: any = { company_id: companyId, provider, model: model || null };
      if (apiKey) {
        payload.api_key = apiKey;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/llm-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setMessage({ text: "Configuration saved successfully!", type: "success" });
        setApiKey(""); // clear field after save for security
        fetchConfig(); // reload state
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
    <div className="max-w-4xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Bot className="w-6 h-6" />
          </div>
          AI Provider Settings
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Configure the brain behind your AI Support Platform.</p>
      </header>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">LLM Provider</label>
              <div className="relative">
                <select 
                  value={provider} 
                  onChange={e => setProvider(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none"
                >
                  <option value="openai">OpenAI (Recommended)</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Model Name</label>
              <input 
                type="text" 
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. gpt-4, claude-3-opus-20240229"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500 mt-2 font-medium">Leave blank to use the provider's default optimal model.</p>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">API Key</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={hasApiKey ? "•••••••••••••••• (Key is already configured)" : "Enter your API key..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-500 mt-2 font-medium">Provide your own API key to bypass system limits. Keys are stored encrypted at rest.</p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
