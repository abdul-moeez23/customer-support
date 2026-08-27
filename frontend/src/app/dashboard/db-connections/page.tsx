"use client";

import { useState } from "react";

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
  const [message, setMessage] = useState("");
  const [tables, setTables] = useState<string[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
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
      setMessage("✅ Connection successful! Database schema retrieved securely.");
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
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
      setMessage("✅ Access policy strictly enforced! The AI can now ONLY query these tables.");
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Database Connections</h2>
        <p className="text-gray-500 mt-2">Securely connect external databases. Your credentials are encrypted at rest.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Connection Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Connect New Database</h3>
          <form onSubmit={handleConnect} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  onChange={(e) => setFormData({...formData, db_type: e.target.value})}
                  value={formData.db_type}
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" required className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Host</label>
                <input type="text" required className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Port</label>
                <input type="text" required className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" value={formData.port} onChange={(e) => setFormData({...formData, port: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Database Name</label>
              <input type="text" required className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" value={formData.database_name} onChange={(e) => setFormData({...formData, database_name: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" required className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" required className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mt-4">
              {loading ? "Testing Connection..." : "Connect Database"}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Access Policies - Only show if tables exist */}
        {tables.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Policies</h3>
            <p className="text-sm text-gray-500 mb-5">Select exactly which tables the AI is allowed to query. It will have NO access to unselected tables.</p>
            
            <div className="space-y-3 max-h-64 overflow-y-auto mb-5 border border-gray-200 rounded-md p-4 bg-gray-50">
              {tables.map(table => (
                <div key={table} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`table-${table}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedTables.includes(table)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTables([...selectedTables, table]);
                      else setSelectedTables(selectedTables.filter(t => t !== table));
                    }}
                  />
                  <label htmlFor={`table-${table}`} className="ml-3 block text-sm font-medium text-gray-700">
                    {table}
                  </label>
                </div>
              ))}
            </div>

            <button onClick={handleSavePolicy} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              Save AI Access Policy
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
