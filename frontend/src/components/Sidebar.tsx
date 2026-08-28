"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Inbox, 
  BookOpen, 
  Database, 
  Link as LinkIcon, 
  Settings, 
  Bot,
  Plus,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("admin@orchestrator.ai");

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("company_id");
    localStorage.removeItem("user_email");
    router.push("/login");
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
    { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: BookOpen },
    { name: 'DB Connections', href: '/dashboard/db-connections', icon: Database },
    { name: 'API Connections', href: '/dashboard/api-connections', icon: LinkIcon },
    { name: 'Widget Customization', href: '/dashboard/widget-settings', icon: Settings },
    { name: 'AI Settings', href: '/dashboard/ai-settings', icon: Bot },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 h-screen flex flex-col shadow-sm relative z-20">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
          <span className="text-white font-bold text-xl">O</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Orchestrator</h1>
          <p className="text-xs font-medium text-slate-500">AI Support Platform</p>
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all duration-200 shadow-sm active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          <span>New Integration</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="px-4 pt-4 pb-12 border-t border-slate-200 mt-auto">
        <div 
          onClick={handleLogout}
          className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group flex items-center space-x-3 shadow-sm"
          title="Click to logout"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 truncate">Dashboard User</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
