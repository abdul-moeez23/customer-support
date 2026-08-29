"use client";

import { useState } from "react";
import { Database, ShieldCheck, Server, AlertCircle, CheckCircle2 } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

export default function DBConnectionsPage() {
  const [formData, setFormData] = useState({
    name: "My Production DB",
    db_type: "postgres",
    host: "localhost",
    port: "5432",
    username: "",
    password: "",
    database_name: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [tables, setTables] = useState<string[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, company_id: companyId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setConnectionId(data.id);

      const schemaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database/${data.id}/schema`);
      const schemaData = await schemaRes.json();
      if (!schemaRes.ok) throw new Error(schemaData.detail);

      setTables(schemaData.tables);
      setMessage({ text: "Connection successful! Schema retrieved securely.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!connectionId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database/allowed-tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: connectionId, tables: selectedTables })
      });

      if (!res.ok) throw new Error("Failed to save policy");
      setMessage({ text: "Access policy saved. The AI can only query selected tables.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const inputClass = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center gap-2.5 mb-1">
          <Database className="w-5 h-5 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Database Connections</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-7.5">Securely connect external databases. Credentials are encrypted at rest.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Connection form */}
        <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900">Connect New Database</h2>
          </div>

          <form onSubmit={handleConnect} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="db_type">Type</label>
                <div className="relative">
                  <CustomSelect
                    id="db_type"
                    value={formData.db_type}
                    onChange={(val) => setFormData({ ...formData, db_type: val })}
                    options={[
                      { value: "postgres", label: "PostgreSQL" },
                      { value: "mysql", label: "MySQL" },
                    ]}
                    aria-label="Database type"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="conn_name">Connection Name</label>
                <input
                  id="conn_name"
                  type="text"
                  required
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="host">Host</label>
                <input
                  id="host"
                  type="text"
                  required
                  className={inputClass}
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="port">Port</label>
                <input
                  id="port"
                  type="text"
                  required
                  className={inputClass}
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="database_name">Database Name</label>
              <input
                id="database_name"
                type="text"
                required
                className={inputClass}
                value={formData.database_name}
                onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  required
                  className={inputClass}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="db_password">Password</label>
                <input
                  id="db_password"
                  type="password"
                  required
                  className={inputClass}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
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
                  : <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
                }
                <span>{message.text}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-all active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                    <span>Testing connection...</span>
                  </>
                ) : (
                  <span>Connect Database</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Access policies panel */}
        <div className="lg:col-span-2">
          {tables.length > 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-900">Table Access Policy</h2>
              </div>
              <div className="p-5">
                <p className="text-xs text-zinc-500 mb-4">The AI will only have access to checked tables.</p>
                <div className="space-y-1 max-h-72 overflow-y-auto mb-5">
                  {tables.map(table => (
                    <label
                      key={table}
                      htmlFor={`table-${table}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 cursor-pointer group transition-colors"
                    >
                      <input
                        type="checkbox"
                        id={`table-${table}`}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                        checked={selectedTables.includes(table)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTables([...selectedTables, table]);
                          else setSelectedTables(selectedTables.filter(t => t !== table));
                        }}
                      />
                      <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 font-mono">{table}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSavePolicy}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Access Policy
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col items-center text-center">
              <ShieldCheck className="w-8 h-8 text-zinc-200 mb-3" />
              <p className="text-sm font-semibold text-zinc-500">No tables yet</p>
              <p className="text-xs text-zinc-400 mt-1">Connect a database to configure table access policies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
