import React, { useState } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle } from 'lucide-react';
import { Student } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  students: Student[];
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  students,
}) => {
  const [studentId, setStudentId] = useState<number | ''>(students[0]?.id || '');
  const [timeIn, setTimeIn] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 60);
    return d.toISOString().slice(0, 16);
  });
  const [timeOut, setTimeOut] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [purpose, setPurpose] = useState('Laboratory & Class Session');
  const [notes, setNotes] = useState('Retroactive administrative entry');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError('Please select a student.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: Number(studentId),
          time_in: timeIn,
          time_out: timeOut || null,
          purpose,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record manual attendance.');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Manual Attendance Entry
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Student *
            </label>
            <div className="relative">
              <select
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id_number} - {s.full_name} ({s.course_department})
                  </option>
                ))}
              </select>
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Time In *
              </label>
              <input
                type="datetime-local"
                required
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Time Out (Optional)
              </label>
              <input
                type="datetime-local"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Purpose / Activity
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Regular Class, Lab Session, Exam"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Administrative Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for manual adjustment..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Recording...' : 'Save Attendance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
