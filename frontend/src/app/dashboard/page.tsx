"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Activity, Shield, Key, Layout, Server, Database, Code2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      const companyId = localStorage.getItem("company_id");
      
      if (!companyId) {
        router.push("/signup");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}`);
        if (!res.ok) throw new Error("Company not found");
        const data = await res.json();
        setCompany(data);
      } catch (err) {
        console.error(err);
        router.push("/signup");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [router]);

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {company.name}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            Here is the integration status and details for your AI Support system.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
          <Activity className="w-4 h-4" />
          <span>System Operational</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integration Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Integration Details</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Company ID</label>
              <div className="flex items-center space-x-2 group">
                <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 font-mono shadow-inner overflow-x-auto whitespace-nowrap">
                  {company.id}
                </code>
                <button 
                  onClick={() => copyToClipboard(company.id, setCopiedId)}
                  className="p-3 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Copy Company ID"
                >
                  {copiedId ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Internal identifier for backend tracking.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Public Widget Key</label>
              <div className="flex items-center space-x-2 group">
                <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 font-mono shadow-inner overflow-x-auto whitespace-nowrap">
                  {company.widget_key}
                </code>
                <button 
                  onClick={() => copyToClipboard(company.widget_key, setCopiedKey)}
                  className="p-3 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Copy Widget Key"
                >
                  {copiedKey ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Use this key strictly in your frontend widget snippet.</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">System Status</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">LLM Provider</span>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs rounded-full font-bold">OpenAI Connected</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Database Access</span>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs rounded-full font-bold">PostgreSQL Connected</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <Layout className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Knowledge Base</span>
              </div>
              <span className="text-sm text-slate-900 font-bold bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">0 Docs Synced</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <Code2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Active MCP Tools</span>
              </div>
              <span className="text-sm text-slate-900 font-bold bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">0 Tools Allowed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Snippet */}
      <div className="bg-slate-900 rounded-2xl p-1 shadow-xl overflow-hidden relative">
        <div className="bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Embed Chat Widget</h3>
              <p className="text-sm text-slate-400 font-medium">Paste this code right before the closing <code>&lt;/body&gt;</code> tag of your website.</p>
            </div>
            <button 
              onClick={() => copyToClipboard(`<script src="https://cdn.my-platform.com/widget.js" data-widget-key="${company.widget_key}"></script>`, setCopiedSnippet)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>
          
          <pre className="bg-black/50 border border-slate-800 rounded-xl p-5 overflow-x-auto text-sm text-indigo-300 font-mono shadow-inner">
            <code>
{`<!-- AI Customer Support Widget -->
<script
  src="https://cdn.my-platform.com/widget.js"
  data-widget-key="${company.widget_key}">
</script>`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
