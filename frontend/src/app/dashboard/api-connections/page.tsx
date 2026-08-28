"use client";

import { useState } from "react";
import { Link as LinkIcon, Plus, Save, Server, Code2, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";

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

    // Simulate saving API connection
    setTimeout(() => {
      setLoading(false);
      setMessage({ text: "API Connection saved successfully. Note: MCP integration for REST APIs is pending backend implementation.", type: "success" });
    }, 1000);
  };

  const addEndpoint = () => {
    setEndpoints([...endpoints, { path: "", method: "GET", description: "" }]);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <LinkIcon className="w-6 h-6" />
          </div>
          REST API Connections
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Connect external REST APIs (like Stripe, Shopify) for the AI to query seamlessly.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Connection Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm h-fit">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-6 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            Connect New API
          </h3>
          
          <form onSubmit={handleConnect} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">API Name</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Base URL</label>
              <input 
                type="url" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" 
                value={formData.base_url} 
                onChange={(e) => setFormData({...formData, base_url: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Auth Type</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    onChange={(e) => setFormData({...formData, auth_type: e.target.value})}
                    value={formData.auth_type}
                  >
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="header">Custom Header</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">API Key / Token</label>
                <input 
                  type="password" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={formData.api_key} 
                  onChange={(e) => setFormData({...formData, api_key: e.target.value})} 
                  placeholder="Encrypted at rest" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98] mt-6 shadow-sm"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save API Connection</span>
                </>
              )}
            </button>
          </form>

          {message.text && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* Endpoints */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm h-fit">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-2 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-600" />
            Allowed Endpoints
          </h3>
          <p className="text-sm text-slate-500 mb-6 font-medium">Define exactly which endpoints the AI can call.</p>
          
          <div className="space-y-4 mb-6">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start border border-slate-200 p-4 rounded-xl bg-slate-50">
                <div className="relative w-full sm:w-auto">
                  <select 
                    className="w-full sm:w-auto pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm"
                    value={ep.method}
                    onChange={(e) => {
                      const newEps = [...endpoints];
                      newEps[idx].method = e.target.value;
                      setEndpoints(newEps);
                    }}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <input 
                    type="text" 
                    placeholder="/endpoint/path"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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

          <button 
            onClick={addEndpoint} 
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Add Endpoint
          </button>
        </div>

      </div>
    </div>
  );
}
