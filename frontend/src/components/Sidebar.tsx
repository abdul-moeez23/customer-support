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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <>
      <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800 h-screen flex flex-col relative z-20 transition-colors">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white dark:text-zinc-900 font-bold text-sm">O</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">Orchestrator</h1>
            <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">AI Support Platform</p>
          </div>
        </div>

        {/* New integration CTA */}
        <div className="px-4 pb-4">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-150 cursor-pointer">
            <Zap className="w-3.5 h-3.5" />
            <span>New Integration</span>
          </button>
        </div>

        {/* Section label */}
        <div className="px-4 mb-1">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Navigation</p>
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
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="px-4 pt-3 pb-6 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
            title="Sign out"
            aria-label="Sign out"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-sm font-bold flex-shrink-0">
              {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">Dashboard User</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{userEmail}</p>
            </div>
            <LogOut className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-red-400 dark:group-hover:text-red-400 transition-colors flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Sign out of Orchestrator?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              You will need to sign in again to access your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-sm rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
