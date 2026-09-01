/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Activity, Shield, Key, Server, Database, Code2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      const companyId = localStorage.getItem("company_id");

      if (!companyId) {
        router.push("/signup");
        return;
      }

      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
        
        // Fetch company
        const res = await fetch(`${apiUrl}/api/companies/${companyId}`);
        if (!res.ok) throw new Error("Company not found");
        const data = await res.json();
        setCompany(data);

      } catch (err) {
        console.warn("Fetch company failed:", (err as Error).message);
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
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="flex-1 overflow-auto bg-zinc-50">
      {/* Top Header */}
      <header className="bg-white border-b border-zinc-200 px-8 py-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                {company.name}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">Integration overview and credentials</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-semibold">System Operational</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-4xl mx-auto p-8 space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Database className="w-5 h-5 text-zinc-400" />
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Active</span>
              </div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">LLM Provider</h3>
              <p className="text-base font-bold text-zinc-900">OpenAI Connected</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Database className="w-5 h-5 text-zinc-400" />
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Active</span>
              </div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Database</h3>
              <p className="text-base font-bold text-zinc-900">PostgreSQL Connected</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-5 h-5 text-zinc-400" />
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Idle</span>
              </div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Knowledge Base</h3>
              <p className="text-base font-bold text-zinc-900">0 Docs Synced</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Code2 className="w-5 h-5 text-zinc-400" />
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Idle</span>
              </div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">MCP Tools</h3>
              <p className="text-base font-bold text-zinc-900">0 Tools Active</p>
            </div>
          </div>

          {/* Integration Setup Section */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-bold text-zinc-800">Integration Credentials</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Company ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-700 font-mono overflow-x-auto whitespace-nowrap">
                    {company.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(company.id, setCopiedId)}
                    className="p-2.5 bg-white border border-zinc-200 text-zinc-500 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 flex-shrink-0 cursor-pointer"
                    title="Copy Company ID"
                    aria-label="Copy Company ID"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">Internal identifier for backend tracking.</p>
              </div>
            </div>
          </div>

          {/* Embed snippet */}
          <div className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white">Embed Chat Widget</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Paste before the closing <code className="text-zinc-300 font-mono">&lt;/body&gt;</code> tag
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(`<script src="https://cdn.my-platform.com/widget.js" data-widget-key="YOUR_WIDGET_KEY"></script>`, setCopiedSnippet)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg transition-colors border border-zinc-700 cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 overflow-x-auto">
              <code className="text-sm font-mono text-zinc-300">
{`<!-- AI Customer Support Widget -->
<script
  src="https://cdn.my-platform.com/widget.js"
  data-widget-key="YOUR_WIDGET_KEY">
</script>`}
              </code>
            </pre>
          </div>
        </main>
    </div>
  );
}
