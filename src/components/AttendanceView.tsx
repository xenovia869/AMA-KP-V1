import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Plus, 
  Trash2, 
  User, 
  Clock, 
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Student, AttendanceLog } from '../types';

interface AttendanceViewProps {
  students: Student[];
  logs: AttendanceLog[];
  onRefresh: () => void;
  onOpenManualModal: () => void;
  selectedStudentId: number | null;
  setSelectedStudentId: (id: number | null) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  logs,
  onRefresh,
  onOpenManualModal,
  selectedStudentId,
  setSelectedStudentId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  // Selected student details
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Client-side quick filter of logs based on controls
  const filteredLogs = logs.filter((log) => {
    // Student filter
    if (selectedStudentId !== null && log.student_id !== selectedStudentId) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN' && (log.status !== 'IN' || log.time_out !== null)) return false;
      if (statusFilter === 'OUT' && log.status !== 'OUT') return false;
    }

    // Date range filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (!log.time_in.startsWith(today)) return false;
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (new Date(log.time_in) < sevenDaysAgo) return false;
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (new Date(log.time_in) < thirtyDaysAgo) return false;
    } else if (dateFilter === 'custom') {
      if (startDate && log.time_in < `${startDate}T00:00:00`) return false;
      if (endDate && log.time_in > `${endDate}T23:59:59`) return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = log.full_name?.toLowerCase().includes(term);
      const matchId = log.id_number?.toLowerCase().includes(term);
      const matchPurpose = log.purpose?.toLowerCase().includes(term);
      const matchNotes = log.notes?.toLowerCase().includes(term);
      if (!matchName && !matchId && !matchPurpose && !matchNotes) return false;
    }

    return true;
  });

  // Calculate summary metrics for the currently filtered set
  const totalLogs = filteredLogs.length;
  const totalMinutes = filteredLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const activeInCount = filteredLogs.filter((l) => l.status === 'IN' && !l.time_out).length;

  // Handle Export to Excel (.xlsx)
  const handleExportExcel = () => {
    setIsExporting(true);

    const params = new URLSearchParams();
    if (selectedStudentId !== null) {
      params.append('student_id', String(selectedStudentId));
    }
    if (statusFilter !== 'ALL') {
      params.append('status', statusFilter);
    }
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      params.append('start_date', today);
      params.append('end_date', today);
    } else if (dateFilter === 'custom') {
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
    }
    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }

    const downloadUrl = `/api/export/excel?${params.toString()}`;
    
    // Trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(false), 800);
  };

  const handleDeleteLog = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Excel Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Attendance Records & Excel Reporting
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Query time in/out logs and produce formal formatted Microsoft Excel (.xlsx) files.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenManualModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Manual Entry</span>
          </button>

          {/* Primary Action: Excel Exporter */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
            title="Download Excel file (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting
                ? 'Generating Spreadsheet...'
                : selectedStudent
                ? `Export ${selectedStudent.id_number} Excel (.xlsx)`
                : 'Export Master Excel (.xlsx)'}
            </span>
          </button>
        </div>
      </div>

      {/* Selected Student Dossier Banner (if specific student is selected) */}
      {selectedStudent && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={selectedStudent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={selectedStudent.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-900">
                  {selectedStudent.id_number}
                </span>
                <span className="text-xs text-blue-700 font-medium">Specific Student Selected</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedStudent.full_name}</h2>
              <p className="text-xs text-slate-600">
                {selectedStudent.course_department} · {selectedStudent.year_level} · {selectedStudent.email || 'No email registered'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">Student Total Time</p>
              <p className="text-xl font-bold font-mono text-blue-900">{totalHours} hrs</p>
            </div>
            <button
              onClick={() => setSelectedStudentId(null)}
              className="px-3 py-1.5 text-xs text-blue-700 hover:text-blue-900 bg-white border border-blue-300 hover:bg-blue-100 rounded-md font-medium transition-colors"
            >
              Clear Filter (Show All)
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar (Bootstrap Form Controls styling) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* 1. Student Dropdown Selector */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Filter by Student
            </label>
            <div className="relative">
              <select
                value={selectedStudentId !== null ? String(selectedStudentId) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStudentId(val ? parseInt(val, 10) : null);
                }}
                className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
              >
                <option value="">-- All Students (Master View) --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id_number} - {s.full_name} ({s.course_department})
                  </option>
                ))}
              </select>
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Date Quick Preset Filter */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Date Window
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
            >
              <option value="all">All Recorded Dates</option>
              <option value="today">Today Only</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* 3. Status Filter */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN">Currently Timed In</option>
              <option value="OUT">Completed / Timed Out</option>
            </select>
          </div>

          {/* 4. Keyword Search */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Search Purpose / Notes
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker when selected */}
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-600">From Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-800"
            />
            <span className="text-xs font-medium text-slate-600">To Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-800"
            />
          </div>
        )}

        {/* Stats summary bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-slate-900 font-mono">{filteredLogs.length}</strong> logs
            </span>
            <span>·</span>
            <span>
              Cumulative Duration: <strong className="text-slate-900 font-mono">{totalHours} hrs</strong> ({totalMinutes} mins)
            </span>
            <span>·</span>
            <span>
              Active In: <strong className="text-emerald-700 font-mono">{activeInCount}</strong>
            </span>
          </div>

          <span className="text-slate-400">
            Clicking "Export Excel" produces a formatted spreadsheet matching these criteria.
          </span>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Time In</th>
                <th className="py-3 px-4">Time Out</th>
                <th className="py-3 px-4 text-right">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Purpose / Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">No attendance records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting filters or record a new punch in the Kiosk view.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isIn = log.status === 'IN' && !log.time_out;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {new Date(log.time_in).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedStudentId(log.student_id)}
                          title="Filter table and Excel export by this student"
                          className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {log.id_number}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {log.full_name}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {new Date(log.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {log.time_out ? (
                          new Date(log.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-slate-400 italic">--</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-right whitespace-nowrap">
                        {log.duration_minutes !== null ? (
                          <span className="font-semibold text-slate-800">
                            {Math.floor(log.duration_minutes / 60)}h {log.duration_minutes % 60}m
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold animate-pulse">Active In</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isIn
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isIn ? 'TIMED IN' : 'TIMED OUT'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title={log.purpose}>
                        {log.purpose}
                        {log.notes && <span className="text-slate-400 ml-1">({log.notes})</span>}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
