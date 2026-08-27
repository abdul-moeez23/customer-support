import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
        <h1 className="text-xl font-bold text-gray-800">AI Support</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link href="/dashboard" className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium">
          <span>Dashboard</span>
        </Link>
        <Link href="/dashboard/inbox" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
          <span>Inbox (Escalations)</span>
        </Link>
        <Link href="/dashboard/knowledge-base" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
          <span>Knowledge Base</span>
        </Link>
        <Link href="/dashboard/db-connections" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
          <span>Database Connections</span>
        </Link>
        <Link href="/dashboard/api-connections" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
          <span>API Connections</span>
        </Link>
        <Link href="/dashboard/widget-settings" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
          <span>Widget Customization</span>
        </Link>
        <Link href="/dashboard/ai-settings" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
          <span>AI Settings</span>
        </Link>
      </nav>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">T</div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">TechCorp Inc.</p>
            <p className="text-xs text-gray-500 truncate">admin@techcorp.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
