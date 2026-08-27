"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="p-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back, {company.name}</h2>
        <p className="text-gray-500 mt-2">Here is the integration status and details for your AI Support system.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Company Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Integration Details</h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company ID</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 font-mono">{company.id}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(company.id)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors font-medium">Copy</button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Internal identifier for backend tracking.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Public Widget Key</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 font-mono">{company.widget_key}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(company.widget_key)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors font-medium">Copy</button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Use this key strictly in your frontend widget snippet.</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">System Status</h3>
          
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">LLM Provider</span>
              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">OpenAI Connected</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Database Access</span>
              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">PostgreSQL Connected</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Knowledge Base</span>
              <span className="text-sm text-gray-900 font-medium">0 Documents Synced</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Active MCP Tools</span>
              <span className="text-sm text-gray-900 font-medium">0 Tools Allowed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Snippet */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Embed Chat Widget</h3>
        <p className="text-sm text-gray-500 mb-4">Paste this code right before the closing <code>&lt;/body&gt;</code> tag of your website.</p>
        
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-800 rounded-md p-5 overflow-x-auto text-sm text-gray-100 font-mono"><code>{`<!-- AI Customer Support Widget -->
<script
  src="https://cdn.my-platform.com/widget.js"
  data-widget-key="${company.widget_key}">
</script>`}</code></pre>
          <button 
            onClick={() => navigator.clipboard.writeText(`<script src="https://cdn.my-platform.com/widget.js" data-widget-key="${company.widget_key}"></script>`)}
            className="absolute top-4 right-4 px-3 py-1.5 bg-gray-700 text-white rounded-md text-xs hover:bg-gray-600 transition-colors font-medium">Copy Snippet</button>
        </div>
      </div>
    </div>
  );
}
