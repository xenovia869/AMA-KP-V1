import React from 'react';
import { Clock, Users, FileSpreadsheet, Server, Database, Download } from 'lucide-react';

interface NavbarProps {
  activeTab: 'kiosk' | 'records' | 'students' | 'hosting';
  setActiveTab: (tab: 'kiosk' | 'records' | 'students' | 'hosting') => void;
  lanUrl: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, lanUrl }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Zone */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Chronos Attendance
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">Local Time In & Out System</p>
            </div>
          </div>

          {/* Navigation Links (Bootstrap/Dashboard Tab Style) */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('kiosk')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'kiosk'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Time Clock Kiosk</span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'records'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Attendance & Excel</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Students</span>
            </button>

            <button
              onClick={() => setActiveTab('hosting')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'hosting'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Server className="w-4 h-4" />
              <span className="hidden md:inline">PC Hosting & Static IP</span>
              <span className="md:hidden">Host Guide</span>
            </button>
          </nav>

          {/* Right Action: SQLite DB file direct backup */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/api/db/download"
              download="attendance.db"
              title="Download local SQLite binary file (attendance.db)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>attendance.db</span>
              <Download className="w-3 h-3 text-slate-400 ml-0.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
