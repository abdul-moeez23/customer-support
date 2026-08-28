"use client";

import { useState } from "react";
import { Database, ShieldCheck, Server, AlertCircle, ChevronDown } from "lucide-react";

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
      // 1. Save and test connection
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/connections/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, company_id: companyId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      setConnectionId(data.id);
      
      // 2. Fetch schema
      const schemaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/connections/database/${data.id}/schema`);
      const schemaData = await schemaRes.json();
      if (!schemaRes.ok) throw new Error(schemaData.detail);
      
      setTables(schemaData.tables);
      setMessage({ text: "Connection successful! Database schema retrieved securely.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!connectionId) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/connections/database/allowed-tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: connectionId, tables: selectedTables })
      });
      
      if (!res.ok) throw new Error("Failed to save policy");
      setMessage({ text: "Access policy strictly enforced! The AI can now ONLY query these tables.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          Database Connections
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Securely connect external databases. Your credentials are encrypted at rest.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Connection Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm w-full lg:max-w-xl flex-shrink-0">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-6 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            Connect New Database
          </h3>
          
          <form onSubmit={handleConnect} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white border border-slate-300 shadow-sm rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    onChange={(e) => setFormData({...formData, db_type: e.target.value})}
                    value={formData.db_type}
                  >
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Connection Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Host</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={formData.host} 
                  onChange={(e) => setFormData({...formData, host: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Port</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={formData.port} 
                  onChange={(e) => setFormData({...formData, port: e.target.value})} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Database Name</label>
              <input 
                type="text" 
                required 
                className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                value={formData.database_name} 
                onChange={(e) => setFormData({...formData, database_name: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input 
                  type="password" 
                  required 
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98] mt-6 shadow-sm"
            >
              {loading ? "Testing Connection..." : "Connect Database"}
            </button>
          </form>

          {message.text && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" /> : <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-500" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* Access Policies */}
        {tables.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm h-fit">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Access Policies
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Select exactly which tables the AI is allowed to query. It will have NO access to unselected tables.</p>
            
            <div className="space-y-2 max-h-80 overflow-y-auto mb-6 p-2 rounded-xl bg-slate-50 border border-slate-100">
              {tables.map(table => (
                <div key={table} className="flex items-center p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    id={`table-${table}`}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    checked={selectedTables.includes(table)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTables([...selectedTables, table]);
                      else setSelectedTables(selectedTables.filter(t => t !== table));
                    }}
                  />
                  <label htmlFor={`table-${table}`} className="ml-3 block text-sm font-semibold text-slate-700 cursor-pointer w-full">
                    {table}
                  </label>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSavePolicy} 
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm"
            >
              Save AI Access Policy
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
