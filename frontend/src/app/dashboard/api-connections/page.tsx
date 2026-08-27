"use client";

import { useState } from "react";

export default function APIConnectionsPage() {
  const [formData, setFormData] = useState({
    name: "Stripe API",
    base_url: "https://api.stripe.com/v1",
    auth_type: "bearer",
    api_key: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [endpoints, setEndpoints] = useState([{ path: "/customers", method: "GET", description: "List customers" }]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Simulate saving API connection
    setTimeout(() => {
      setLoading(false);
      setMessage("✅ API Connection saved successfully. Note: MCP integration for REST APIs is pending backend implementation.");
    }, 1000);
  };

  const addEndpoint = () => {
    setEndpoints([...endpoints, { path: "", method: "GET", description: "" }]);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">REST API Connections</h2>
        <p className="text-gray-500 mt-2">Connect external REST APIs (like Stripe, Shopify) for the AI to query.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Connection Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Connect New API</h3>
          <form onSubmit={handleConnect} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700">API Name</label>
              <input type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Base URL</label>
              <input type="url" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" value={formData.base_url} onChange={(e) => setFormData({...formData, base_url: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Auth Type</label>
                <select 
                  className="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md sm:text-sm"
                  onChange={(e) => setFormData({...formData, auth_type: e.target.value})}
                  value={formData.auth_type}
                >
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="header">Custom Header</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key / Token</label>
                <input type="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" value={formData.api_key} onChange={(e) => setFormData({...formData, api_key: e.target.value})} placeholder="Encrypted at rest" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mt-4">
              {loading ? "Saving..." : "Save API Connection"}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Endpoints */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Allowed Endpoints</h3>
          <p className="text-sm text-gray-500 mb-5">Define exactly which endpoints the AI can call.</p>
          
          <div className="space-y-4 mb-5">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="flex gap-2 items-start border border-gray-100 p-3 rounded-md bg-gray-50">
                <select 
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-xs font-bold"
                  value={ep.method}
                  onChange={(e) => {
                    const newEps = [...endpoints];
                    newEps[idx].method = e.target.value;
                    setEndpoints(newEps);
                  }}
                >
                  <option>GET</option>
                  <option>POST</option>
                </select>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    placeholder="/endpoint/path"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                    value={ep.path}
                    onChange={(e) => {
                      const newEps = [...endpoints];
                      newEps[idx].path = e.target.value;
                      setEndpoints(newEps);
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder="Description for AI (e.g., Get customer details)"
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md"
                    value={ep.description}
                    onChange={(e) => {
                      const newEps = [...endpoints];
                      newEps[idx].description = e.target.value;
                      setEndpoints(newEps);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button onClick={addEndpoint} className="text-sm text-blue-600 font-medium hover:text-blue-800">
            + Add Endpoint
          </button>
        </div>

      </div>
    </div>
  );
}
