import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  FileSpreadsheet, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Mail, 
  Phone, 
  GraduationCap, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Student } from '../types';

interface StudentsViewProps {
  students: Student[];
  onOpenAddModal: () => void;
  onOpenEditModal: (student: Student) => void;
  onRefresh: () => void;
  onSelectStudentForLogs: (studentId: number) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onOpenAddModal,
  onOpenEditModal,
  onRefresh,
  onSelectStudentForLogs,
}) => {
  const [search, setSearch] = useState('');

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.id_number.toLowerCase().includes(q) ||
      s.course_department.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.full_name} (${student.id_number})? All their attendance records will be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadStudentExcel = (student: Student) => {
    const url = `/api/export/excel?student_id=${student.id}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_${student.id_number}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Registered Students Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage student profiles, view rosters, or instantly download an individual's Excel attendance dossier.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Search and Count Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by student ID, name, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs text-slate-500 font-mono self-center">
          {filtered.length} of {students.length} students listed
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={student.full_name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{student.full_name}</h3>
                    <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      ID: {student.id_number}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenEditModal(student)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    title="Edit Student"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(student)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{student.course_department} · {student.year_level}</span>
                </div>
                {student.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                {student.contact_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{student.contact_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions: Export Individual Excel or View Logs */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => handleDownloadStudentExcel(student)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
                title={`Download ${student.full_name}'s Time In/Out Excel dossier`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => onSelectStudentForLogs(student.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>View Logs</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
