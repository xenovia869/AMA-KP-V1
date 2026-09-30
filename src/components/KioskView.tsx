import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Search, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Student, AttendanceLog, ClockResponse } from '../types';
import { playChime } from '../utils/audio';

interface KioskViewProps {
  students: Student[];
  onAttendanceUpdated: () => void;
  recentLogs: AttendanceLog[];
}

export const KioskView: React.FC<KioskViewProps> = ({ students, onAttendanceUpdated, recentLogs }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentInput, setStudentInput] = useState('');
  const [purpose, setPurpose] = useState('Laboratory & Class Session');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    action?: 'IN' | 'OUT';
    title: string;
    message: string;
    student?: Student;
    log?: AttendanceLog;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus input for barcode scanner readiness
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleClock = async (action: 'auto' | 'in' | 'out') => {
    const trimmed = studentInput.trim();
    if (!trimmed) {
      setFeedback({
        type: 'error',
        title: 'Input Required',
        message: 'Please enter or scan a Student ID Number or select a student.',
      });
      if (soundEnabled) playChime('error');
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_identifier: trimmed,
          action,
          purpose,
          station_device: 'PC-Local-Terminal-01'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record attendance');
      }

      const clockRes = data as ClockResponse;
      if (soundEnabled) {
        playChime(clockRes.action_performed === 'IN' ? 'in' : 'out');
      }

      setFeedback({
        type: 'success',
        action: clockRes.action_performed,
        title: clockRes.action_performed === 'IN' ? 'Time In Recorded' : 'Time Out Recorded',
        message: clockRes.message,
        student: clockRes.student,
        log: clockRes.log,
      });

      // Clear input and refocus
      setStudentInput('');
      onAttendanceUpdated();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err: any) {
      if (soundEnabled) playChime('error');
      setFeedback({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Error communicating with local server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleClock('auto');
    }
  };

  // Quick select helper
  const handleSelectStudent = (idNumber: string) => {
    setStudentInput(idNumber);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const activeInCount = recentLogs.filter(l => l.status === 'IN' && !l.time_out).length;
  const todayDateStr = currentTime.toISOString().split('T')[0];
  const todayLogs = recentLogs.filter(l => l.time_in.startsWith(todayDateStr));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Digital Clock & Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Station #1 · Local PC Host</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Campus Attendance Kiosk
          </h1>
          <p className="text-sm text-slate-300">
            Scan barcode, swipe RFID, or enter Student ID number to punch In or Out.
          </p>
        </div>

        {/* Big Tabular Digital Clock */}
        <div className="bg-slate-950/80 px-6 py-4 rounded-xl border border-slate-700/80 text-center shadow-inner min-w-[280px]">
          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-wider text-blue-400 tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1 flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {currentTime.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Audio feedback toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
          title={soundEnabled ? 'Mute sound chimes' : 'Enable audio chimes'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Chimes On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span>Chimes Muted</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid: Clock In Input Form on Left, Instant Feedback on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: ID Input Card */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Time In / Time Out Punch
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supports barcode scanner wedge (automatic Enter), RFID reader, or keyboard typing.
            </p>
          </div>

          {/* Student ID / Number Input */}
          <div className="space-y-2">
            <label htmlFor="student-id-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Student ID Number
            </label>
            <div className="relative">
              <input
                id="student-id-input"
                ref={inputRef}
                type="text"
                placeholder="e.g. 2024-10021"
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
                className="w-full text-lg sm:text-xl font-mono px-4 py-3 pl-11 rounded-lg border-2 border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-semibold"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Quick Suggestions / Registered Students pills */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 mb-2">Quick Pick / Demo Students:</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {students.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s.id_number)}
                    className="text-xs font-mono px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded border border-slate-200 transition-colors"
                  >
                    {s.id_number} · {s.full_name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Purpose / Activity selection */}
          <div className="space-y-2">
            <label htmlFor="purpose-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Session Purpose / Location
            </label>
            <select
              id="purpose-select"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
            >
              <option value="Laboratory & Class Session">Laboratory & Class Session</option>
              <option value="Lecture Hall Session">Lecture Hall Session</option>
              <option value="Library Research / Study">Library Research / Study</option>
              <option value="Faculty Consultation">Faculty Consultation</option>
              <option value="Capstone & Project Work">Capstone & Project Work</option>
              <option value="Club / Extracurricular Activity">Club / Extracurricular Activity</option>
            </select>
          </div>

          {/* Action Buttons (Bootstrap Button Group layout) */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleClock('auto')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base shadow-sm hover:shadow transition-all disabled:opacity-60"
            >
              <Sparkles className="w-5 h-5 text-blue-200" />
              <span>{loading ? 'Processing Punch...' : 'Smart Auto Punch (Time In / Out)'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleClock('in')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm transition-colors disabled:opacity-60 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Force Time IN</span>
              </button>

              <button
                type="button"
                onClick={() => handleClock('out')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-sm transition-colors disabled:opacity-60 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Force Time OUT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Visual Confirmation Banner & Metrics */}
        <div className="lg:col-span-5 space-y-6">
          {/* Feedback Display */}
          {feedback ? (
            <div
              className={`rounded-xl border p-6 shadow-sm transition-all animate-in fade-in duration-200 ${
                feedback.type === 'success'
                  ? feedback.action === 'IN'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    feedback.type === 'success'
                      ? feedback.action === 'IN'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    feedback.action === 'IN' ? <LogIn className="w-6 h-6" /> : <LogOut className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold">{feedback.title}</h3>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/70 border border-current/20">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">{feedback.message}</p>
                </div>
              </div>

              {/* If student object exists, render Student Dossier Snapshot */}
              {feedback.student && (
                <div className="mt-4 pt-4 border-t border-current/15 flex items-center gap-3">
                  <img
                    src={feedback.student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={feedback.student.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-sm">{feedback.student.full_name}</p>
                    <p className="font-mono opacity-80">ID: {feedback.student.id_number}</p>
                    <p className="opacity-75">{feedback.student.course_department} · {feedback.student.year_level}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-100/70 border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-medium text-slate-700">Awaiting Punch</h4>
              <p className="text-xs text-slate-500 mt-1">
                Enter an ID or pick a student on the left to record immediate Time In or Time Out.
              </p>
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Currently In Lab</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">{activeInCount}</span>
                <span className="text-xs text-slate-500">students active</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's Visits</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-blue-600 tabular-nums">{todayLogs.length}</span>
                <span className="text-xs text-slate-500">logs recorded</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Recent Activity Ticker (Today's Logs) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Today's Live Punch Activity</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {todayLogs.length} activity records today
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Time In</th>
                <th className="py-3 px-4">Time Out</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No time-in logs recorded yet for today. Use the form above to record the first entry.
                  </td>
                </tr>
              ) : (
                todayLogs.slice(0, 8).map((log) => {
                  const isIn = log.status === 'IN' && !log.time_out;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {log.full_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {log.id_number}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {new Date(log.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {log.time_out
                          ? new Date(log.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {log.duration_minutes !== null ? (
                          `${Math.floor(log.duration_minutes / 60)}h ${log.duration_minutes % 60}m`
                        ) : (
                          <span className="text-emerald-600 font-semibold animate-pulse">Running</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate">
                        {log.purpose}
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
