"use client";

import { useState, useEffect } from "react";
import { Bot, Save, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/llm-config/${companyId}`);
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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/llm-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage({ text: "Configuration saved successfully!", type: "success" });
        setApiKey("");
        fetchConfig();
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

  const providerModels: Record<string, string> = {
    openai: "e.g. gpt-4o, gpt-4-turbo, gpt-3.5-turbo",
    anthropic: "e.g. claude-3-5-sonnet-20241022",
    gemini: "e.g. gemini-1.5-pro, gemini-1.5-flash",
  };

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
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center gap-2.5 mb-1">
          <Bot className="w-5 h-5 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">AI Settings</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-7.5">Configure the language model powering your support platform.</p>
      </div>

      {/* Form card */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
        <form onSubmit={handleSave}>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="provider">
                  LLM Provider
                </label>
                <div className="relative">
                  <CustomSelect
                    id="provider"
                    value={provider}
                    onChange={(val) => setProvider(val)}
                    options={[
                      { value: "openai", label: "OpenAI" },
                      { value: "anthropic", label: "Anthropic" },
                      { value: "gemini", label: "Google Gemini" },
                    ]}
                    aria-label="LLM Provider"
                  />
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="model">
                  Model <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  id="model"
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder={providerModels[provider]}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="api_key">
                API Key
                {hasApiKey && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                )}
              </label>
              <input
                id="api_key"
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={hasApiKey ? "Enter new key to replace existing..." : "sk-..."}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
              />
              <p className="text-xs text-zinc-400 mt-1.5">Keys are encrypted at rest and never exposed in responses.</p>
            </div>

            {message.text && (
              <div className={`flex items-start gap-2.5 text-sm p-3.5 rounded-lg border ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}>
                {message.type === "success"
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                }
                <span>{message.text}</span>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-zinc-100 flex justify-end bg-zinc-50/50 rounded-b-xl">
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
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-900">Recommendations</h2>
        </div>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li className="flex items-start gap-2"><span className="text-zinc-300 mt-0.5">—</span> <strong className="text-zinc-800">OpenAI GPT-4o</strong> is recommended for best quality responses.</li>
          <li className="flex items-start gap-2"><span className="text-zinc-300 mt-0.5">—</span> Leave the model field blank to use each provider&apos;s latest default.</li>
          <li className="flex items-start gap-2"><span className="text-zinc-300 mt-0.5">—</span> Your API key is used only for your company&apos;s workspace.</li>
        </ul>
      </div>
    </div>
  );
}
