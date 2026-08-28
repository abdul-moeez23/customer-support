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
  LogOut,
  Zap
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
    { name: 'Widget Settings', href: '/dashboard/widget-settings', icon: Settings },
    { name: 'AI Settings', href: '/dashboard/ai-settings', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-100 h-screen flex flex-col relative z-20">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">O</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-zinc-900 tracking-tight leading-none">Orchestrator</h1>
          <p className="text-[11px] font-medium text-zinc-400 mt-0.5">AI Support Platform</p>
        </div>
      </div>

      {/* New integration CTA */}
      <div className="px-4 pb-4">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-sm font-semibold rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all duration-150 cursor-pointer">
          <Zap className="w-3.5 h-3.5" />
          <span>New Integration</span>
        </button>
      </div>

      {/* Section label */}
      <div className="px-4 mb-1">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Navigation</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                isActive 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-4 pt-3 pb-6 border-t border-zinc-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer group"
          title="Sign out"
          aria-label="Sign out"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 text-sm font-bold flex-shrink-0">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-xs font-semibold text-zinc-900 truncate leading-tight">Dashboard User</p>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{userEmail}</p>
          </div>
          <LogOut className="w-3.5 h-3.5 text-zinc-300 group-hover:text-red-400 transition-colors flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}
