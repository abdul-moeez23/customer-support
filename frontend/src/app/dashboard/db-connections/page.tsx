/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Database, ShieldCheck, Server, AlertCircle, CheckCircle2, Trash2, Edit, X } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

export default function DBConnectionsPage() {
  const [formData, setFormData] = useState({
    name: "My Production DB",
    db_type: "postgres",
    host: "localhost",
    port: "5432",
    username: "",
    password: "",
    database_name: "",
    connection_string: ""
  });
  const [useConnectionString, setUseConnectionString] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [tables, setTables] = useState<string[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const [widgets, setWidgets] = useState<Record<string, unknown>[]>([]);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Phase 10 additions
  const [connections, setConnections] = useState<any[]>([]);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageConnectionId, setManageConnectionId] = useState<string | null>(null);
  
  const [tableMapping, setTableMapping] = useState<Record<string, string[]>>({});
  const [allTablesInConn, setAllTablesInConn] = useState<string[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [initialTableSearch, setInitialTableSearch] = useState("");
  const [manageTableSearch, setManageTableSearch] = useState("");

  const fetchWidgets = useCallback(async () => {
    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/widget-config/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setWidgets(data);
          setSelectedWidgets(data.map((w: Record<string, unknown>) => w.id as string));
        }
      }
    } catch (err) {
      console.warn("Failed to load widgets", err);
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database/company/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setConnections(data);
        }
      }
    } catch (err) {
      console.warn("Failed to load connections", err);
    }
  }, []);

  useEffect(() => {
    fetchWidgets();
    fetchConnections();
  }, [fetchWidgets, fetchConnections]);

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
      fetchConnections(); // refresh connections list

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
    setSavingPolicy(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database/allowed-tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: connectionId, tables: selectedTables })
      });

      if (!res.ok) throw new Error("Failed to save global table access policy");

      if (selectedWidgets.length > 0 && selectedTables.length > 0) {
        const promises = selectedWidgets.map(async (widgetId) => {
          const wRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/widget-config/${widgetId}/tables`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connection_id: connectionId, tables: selectedTables })
          });
          if (!wRes.ok) throw new Error(`Failed to save for widget ${widgetId}`);
        });

        await Promise.all(promises);
      }

      setMessage({ text: "Access policy saved and assigned to widgets.", type: "success" });
      setTables([]);
      setConnectionId(null);
      setFormData({ ...formData, password: "" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSavingPolicy(false);
    }
  };

  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);

  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database/${connectionToDelete}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete connection");
      fetchConnections();
    } catch (err) {
      console.warn(err);
      alert("Failed to delete connection.");
    } finally {
      setConnectionToDelete(null);
    }
  };

  const handleDeleteConnection = (id: string) => {
    setConnectionToDelete(id);
  };

  const openManageModal = async (connId: string) => {
    setManageConnectionId(connId);
    setShowManageModal(true);
    setLoadingModal(true);
    try {
      const schemaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database/${connId}/schema`);
      const schemaData = await schemaRes.json();
      const allTables = schemaData.tables || [];
      setAllTablesInConn(allTables);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database/${connId}/widgets`);
      const data = await res.json();
      
      const map: Record<string, string[]> = {};
      allTables.forEach((t: string) => map[t] = []);
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          map[item.table_name] = item.widget_ids || [];
        });
      }
      setTableMapping(map);
    } catch (err) {
      console.warn("Failed to load mappings", err);
    } finally {
      setLoadingModal(false);
    }
  };

  const toggleTableWidget = (tableName: string, widgetId: string) => {
    setTableMapping(prev => {
      const wIds = prev[tableName] || [];
      if (wIds.includes(widgetId)) {
        return { ...prev, [tableName]: wIds.filter(id => id !== widgetId) };
      } else {
        return { ...prev, [tableName]: [...wIds, widgetId] };
      }
    });
  };

  const saveManageModal = async () => {
    if (!manageConnectionId) return;
    setLoadingModal(true);
    try {
      // 1. Save global allowed tables (all tables that have at least one widget assigned)
      const allowedTables = Object.keys(tableMapping).filter(t => tableMapping[t].length > 0);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/connections/database/allowed-tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: manageConnectionId, tables: allowedTables })
      });
      if (!res.ok) throw new Error("Failed to save global tables");

      // 2. Build widget -> tables map
      const widgetToTables: Record<string, string[]> = {};
      widgets.forEach(w => widgetToTables[w.id as string] = []);
      Object.entries(tableMapping).forEach(([table, wIds]) => {
        wIds.forEach(wId => {
          if (widgetToTables[wId]) widgetToTables[wId].push(table);
        });
      });

      // 3. Save for each widget
      const promises = widgets.map(async (w) => {
        const wRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/widget-config/${w.id}/tables`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connection_id: manageConnectionId, tables: widgetToTables[w.id as string] })
        });
        if (!wRes.ok) throw new Error(`Failed to save for widget ${w.id}`);
      });

      await Promise.all(promises);
      setShowManageModal(false);
      setManageConnectionId(null);
    } catch (err) {
      console.warn(err);
      alert("Failed to save mappings.");
    } finally {
      setLoadingModal(false);
    }
  };

  const inputClass = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="pt-2">
        <div className="flex items-center gap-2.5 mb-1">
          <Database className="w-5 h-5 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Database Connections</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-7.5">Securely connect external databases. Credentials are encrypted at rest.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          {/* Active Connections List */}
          {connections.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-bold text-zinc-900">Active Connections</h2>
              </div>
              <div className="p-2 space-y-1">
                {connections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-3 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-colors mx-3 my-1">
                    <div>
                      <p className="text-sm font-medium text-zinc-700">{conn.name}</p>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{conn.db_type}://{conn.host}:{conn.port}/{conn.database_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openManageModal(conn.id)} className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors">
                        Manage Access
                      </button>
                      <button onClick={() => handleDeleteConnection(conn.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connection form */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
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
                        { value: "sqlserver", label: "Microsoft SQL Server" },
                        { value: "mongodb", label: "MongoDB" },
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

              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="connection_mode"
                    checked={!useConnectionString}
                    onChange={() => setUseConnectionString(false)}
                    className="cursor-pointer"
                  />
                  Standard Form
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="connection_mode"
                    checked={useConnectionString}
                    onChange={() => setUseConnectionString(true)}
                    className="cursor-pointer"
                  />
                  Use Connection String
                </label>
              </div>

              {useConnectionString ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="connection_string">Connection String (URI)</label>
                  <input
                    id="connection_string"
                    type="text"
                    required={useConnectionString}
                    className={inputClass}
                    value={formData.connection_string}
                    onChange={(e) => setFormData({ ...formData, connection_string: e.target.value })}
                    placeholder="postgresql://user:password@localhost:5432/dbname"
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="host">Host</label>
                      <input
                        id="host"
                        type="text"
                        required={!useConnectionString}
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
                        required={!useConnectionString}
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
                      required={!useConnectionString}
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
                        required={!useConnectionString}
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
                        required={!useConnectionString}
                        className={inputClass}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </>
              )}

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
        </div>

        {/* Initial Access policies panel (shows only right after connect) */}
        <div className="lg:col-span-2">
          {tables.length > 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-900">Initial Table Access</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-zinc-500">Select tables the AI can access.</p>
                  <button
                    type="button"
                    onClick={() => {
                      const visibleTables = tables.filter(t => t.toLowerCase().includes(initialTableSearch.toLowerCase()));
                      const allSelected = visibleTables.every(t => selectedTables.includes(t));
                      if (allSelected) {
                        setSelectedTables(selectedTables.filter(t => !visibleTables.includes(t)));
                      } else {
                        const newSelected = [...selectedTables];
                        visibleTables.forEach(t => {
                          if (!newSelected.includes(t)) newSelected.push(t);
                        });
                        setSelectedTables(newSelected);
                      }
                    }}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Select All Visible
                  </button>
                </div>
                
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search tables..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                    value={initialTableSearch}
                    onChange={(e) => setInitialTableSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto mb-5 border border-zinc-100 rounded-lg p-2">
                  {tables.filter(t => t.toLowerCase().includes(initialTableSearch.toLowerCase())).map(table => (
                    <label key={table} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 cursor-pointer group transition-colors">
                      <input
                        type="checkbox"
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
                  {tables.filter(t => t.toLowerCase().includes(initialTableSearch.toLowerCase())).length === 0 && (
                    <div className="px-3 py-4 text-center text-zinc-500 text-sm">
                      No matching tables found.
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-100 pt-4 mb-5">
                  <p className="text-xs text-zinc-500 mb-3">Assign these tables to specific widgets:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto border border-zinc-100 rounded-lg p-2">
                    {widgets.map(w => (
                      <label key={w.id as string} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                          checked={selectedWidgets.includes(w.id as string)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedWidgets([...selectedWidgets, w.id as string]);
                            else setSelectedWidgets(selectedWidgets.filter(id => id !== w.id));
                          }}
                        />
                        <span className="text-sm font-medium text-zinc-700">{w.bot_name as string || `Widget ${w.id}`}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSavePolicy}
                  disabled={savingPolicy}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {savingPolicy ? (
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Save Access Policy
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col items-center text-center">
              <ShieldCheck className="w-8 h-8 text-zinc-200 mb-3" />
              <p className="text-sm font-semibold text-zinc-500">No tables yet</p>
              <p className="text-xs text-zinc-400 mt-1">Connect a database to configure initial access policies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manage Access Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900">Manage Table Access</h2>
              <button onClick={() => setShowManageModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-zinc-500 mb-4">Select which widgets have access to each table in this database.</p>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tables..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                value={manageTableSearch}
                onChange={(e) => setManageTableSearch(e.target.value)}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto border border-zinc-200 rounded-lg bg-zinc-50/30">
              {loadingModal ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      <th className="px-4 py-3 border-b border-zinc-200">Table Name</th>
                      <th className="px-4 py-3 border-b border-zinc-200">Allowed Widgets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {allTablesInConn.filter(t => t.toLowerCase().includes(manageTableSearch.toLowerCase())).map(table => (
                      <tr key={table} className="hover:bg-white transition-colors">
                        <td className="px-4 py-3 font-mono text-zinc-700 whitespace-nowrap align-top pt-4">{table}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {widgets.map(w => {
                              const isActive = (tableMapping[table] || []).includes(w.id as string);
                              return (
                                <button
                                  key={w.id as string}
                                  onClick={() => toggleTableWidget(table, w.id as string)}
                                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                                    isActive 
                                      ? "bg-zinc-900 text-white border-zinc-900" 
                                      : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                                  }`}
                                >
                                  {w.bot_name as string || `Widget ${w.id}`}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allTablesInConn.filter(t => t.toLowerCase().includes(manageTableSearch.toLowerCase())).length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-zinc-500 text-sm">
                          No matching tables found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={saveManageModal}
                disabled={loadingModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50"
              >
                {loadingModal ? (
                  <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Save Mappings
              </button>
            </div>
          </div>
        </div>
      )}
      {connectionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Delete Connection</h2>
            <p className="text-sm text-zinc-500 mb-6">Are you sure you want to delete this database connection? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConnectionToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteConnection}
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
