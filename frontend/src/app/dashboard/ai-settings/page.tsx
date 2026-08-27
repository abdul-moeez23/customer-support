"use client";

import { useState, useEffect } from "react";

export default function AISettingsPage() {
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
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
    setMessage("");

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
        setMessage("Configuration saved successfully!");
        setApiKey(""); // clear field after save for security
        fetchConfig(); // reload state
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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Settings</h1>
      
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LLM Provider</label>
            <select 
              value={provider} 
              onChange={e => setProvider(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="openai">OpenAI (Recommended)</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Model Name (Optional)</label>
            <input 
              type="text" 
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="e.g. gpt-4, claude-3-opus-20240229"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank to use the provider's default optimal model.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={hasApiKey ? "•••••••••••••••• (Key is already configured)" : "Enter your API key..."}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Provide your own API key to bypass system limits. Keys are stored encrypted.</p>
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
              {saving ? "Saving..." : "Save AI Settings"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
