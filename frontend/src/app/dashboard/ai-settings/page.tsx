/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Plus, Trash2, Key } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

export default function AISettingsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [showForm, setShowForm] = useState(false);

  const fetchConfigs = async () => {
    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const res = await fetch(`${apiUrl}/api/llm-config/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setConfigs(data || []);
      }
    } catch (err) {
      console.warn("Failed to load AI configs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const companyId = localStorage.getItem("company_id");
    try {
      const payload: any = { company_id: companyId, provider, name, api_key: apiKey };

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const res = await fetch(`${apiUrl}/api/llm-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage({ text: "API Key saved successfully!", type: "success" });
        setName("");
        setApiKey("");
        setShowForm(false);
        fetchConfigs();
      } else {
        setMessage({ text: "Failed to save API Key.", type: "error" });
      }
    } catch (err) {
      console.warn(err);
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!keyToDelete) return;
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const res = await fetch(`${apiUrl}/api/llm-config/${keyToDelete}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchConfigs();
      }
    } catch (err) {
      console.warn("Failed to delete", err);
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleDelete = (id: string) => {
    setKeyToDelete(id);
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pt-2 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Key className="w-5 h-5 text-zinc-400" />
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">API Keys Vault</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-7.5">Manage your named API keys for different providers and assign them to specific widgets.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Key
          </button>
        )}
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

      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 rounded-t-xl">
            <h2 className="font-semibold text-zinc-800">Add New API Key</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">✕</button>
          </div>
          <form onSubmit={handleSave}>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Key Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Support Team OpenAI"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">LLM Provider</label>
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
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">API Key</label>
                <input
                  required
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 flex justify-end bg-zinc-50/50 rounded-b-xl gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? "Saving..." : "Save Key"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        {configs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No API keys configured yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {configs.map((c: any) => (
                <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 text-zinc-900 font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-zinc-600 capitalize">{c.provider}</td>
                  <td className="px-6 py-4">
                    {c.has_api_key ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Missing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-zinc-400 hover:text-red-600 cursor-pointer p-1 transition-colors rounded hover:bg-red-50"
                      title="Delete Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {keyToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Delete API Key</h2>
            <p className="text-sm text-zinc-500 mb-6">Are you sure you want to delete this API key? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setKeyToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
