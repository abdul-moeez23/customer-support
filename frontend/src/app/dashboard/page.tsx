"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Activity, Shield, Key, Server, Database, Code2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  widget_key: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/companies/${companyId}`);
        if (!res.ok) throw new Error("Company not found");
        const data = await res.json();
        setCompany(data);
      } catch (err) {
        console.error("Fetch company failed:", (err as Error).message);
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
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const statusItems = [
    { icon: Server, label: "LLM Provider", value: "OpenAI Connected", status: "connected" },
    { icon: Database, label: "Database", value: "PostgreSQL Connected", status: "connected" },
    { icon: Shield, label: "Knowledge Base", value: "0 Docs Synced", status: "idle" },
    { icon: Code2, label: "MCP Tools", value: "0 Tools Active", status: "idle" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {company.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Integration overview and credentials</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full w-fit">
          <Activity className="w-3.5 h-3.5" />
          <span>System Operational</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statusItems.map((item) => (
          <div key={item.label} className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <item.icon className="w-4 h-4 text-zinc-400" />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                item.status === "connected"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200"
              }`}>
                {item.status === "connected" ? "Active" : "Idle"}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-semibold text-zinc-800 mt-0.5 leading-tight">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Credentials */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Key className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-900">Integration Credentials</h2>
        </div>

        <div className="space-y-4">
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

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Public Widget Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-700 font-mono overflow-x-auto whitespace-nowrap">
                {company.widget_key}
              </code>
              <button
                onClick={() => copyToClipboard(company.widget_key, setCopiedKey)}
                className="p-2.5 bg-white border border-zinc-200 text-zinc-500 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 flex-shrink-0 cursor-pointer"
                title="Copy Widget Key"
                aria-label="Copy Widget Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">Use this key in your frontend widget embed snippet.</p>
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
            onClick={() => copyToClipboard(`<script src="https://cdn.my-platform.com/widget.js" data-widget-key="${company.widget_key}"></script>`, setCopiedSnippet)}
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
        <pre className="px-5 py-5 text-sm text-sky-300 font-mono overflow-x-auto">
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
  );
}
