"use client";

import { useState } from "react";
import { Link as LinkIcon, Plus, Save, Server, Code2, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

export default function APIConnectionsPage() {
  const [formData, setFormData] = useState({
    name: "Stripe API",
    base_url: "https://api.stripe.com/v1",
    auth_type: "bearer",
    api_key: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [endpoints, setEndpoints] = useState([{ path: "/customers", method: "GET", description: "List customers" }]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, company_id: companyId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      const epRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/api/allowed-endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: data.id, endpoints })
      });
      
      const epData = await epRes.json();
      if (!epRes.ok) throw new Error(epData.detail);

      setMessage({
        text: "API Connection and Allowed Endpoints saved successfully.",
        type: "success"
      });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const addEndpoint = () => {
    setEndpoints([...endpoints, { path: "", method: "GET", description: "" }]);
  };

  const removeEndpoint = (idx: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== idx));
  };

  const inputClass = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400";

  const methodColors: Record<string, string> = {
    GET: "text-emerald-700 bg-emerald-50 border-emerald-200",
    POST: "text-blue-700 bg-blue-50 border-blue-200",
    PUT: "text-amber-700 bg-amber-50 border-amber-200",
    DELETE: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center gap-2.5 mb-1">
          <LinkIcon className="w-5 h-5 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">API Connections</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-7.5">Connect external REST APIs for the AI to query on behalf of your customers.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Connection form */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900">Connect New API</h2>
          </div>

          <form onSubmit={handleConnect} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="api_name">API Name</label>
              <input
                id="api_name"
                type="text"
                required
                className={inputClass}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="base_url">Base URL</label>
              <input
                id="base_url"
                type="url"
                required
                className={inputClass + " font-mono"}
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="auth_type">Auth Type</label>
                <div className="relative">
                  <CustomSelect
                    id="auth_type"
                    value={formData.auth_type}
                    onChange={(val) => setFormData({ ...formData, auth_type: val })}
                    options={[
                      { value: "bearer", label: "Bearer Token" },
                      { value: "basic", label: "Basic Auth" },
                      { value: "header", label: "Custom Header" },
                    ]}
                    aria-label="Auth type"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="api_key">API Key / Token</label>
                <input
                  id="api_key"
                  type="password"
                  required
                  className={inputClass}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Encrypted at rest"
                />
              </div>
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

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-all active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save API Connection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Endpoints */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900">Allowed Endpoints</h2>
          </div>

          <div className="p-6 space-y-3">
            <p className="text-xs text-zinc-500">Define exactly which endpoints the AI can call.</p>

            <div className="space-y-2.5">
              {endpoints.map((ep, idx) => (
                <div key={idx} className="border border-zinc-100 rounded-xl p-3.5 bg-zinc-50/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-28">
                      <CustomSelect
                        value={ep.method}
                        onChange={(val) => {
                          const newEps = [...endpoints];
                          newEps[idx].method = val;
                          setEndpoints(newEps);
                        }}
                        options={[
                          { value: "GET", label: "GET" },
                          { value: "POST", label: "POST" },
                          { value: "PUT", label: "PUT" },
                          { value: "DELETE", label: "DELETE" },
                        ]}
                        size="sm"
                        aria-label="HTTP Method"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="/endpoint/path"
                      className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={ep.path}
                      onChange={(e) => {
                        const newEps = [...endpoints];
                        newEps[idx].path = e.target.value;
                        setEndpoints(newEps);
                      }}
                      aria-label="Endpoint path"
                    />
                    <button
                      type="button"
                      onClick={() => removeEndpoint(idx)}
                      className="text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                      aria-label="Remove endpoint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Description for AI (e.g., List customers by email)"
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
                    value={ep.description}
                    onChange={(e) => {
                      const newEps = [...endpoints];
                      newEps[idx].description = e.target.value;
                      setEndpoints(newEps);
                    }}
                    aria-label="Endpoint description"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addEndpoint}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-zinc-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Endpoint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
