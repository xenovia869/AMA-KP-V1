import React, { useState, useEffect } from 'react';
import { X, User, Hash, BookOpen, Mail, Phone, Image as ImageIcon } from 'lucide-react';
import { Student } from '../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  studentToEdit: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
}) => {
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [course, setCourse] = useState('BS Computer Science');
  const [yearLevel, setYearLevel] = useState('1st Year');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentToEdit) {
      setIdNumber(studentToEdit.id_number);
      setFullName(studentToEdit.full_name);
      setCourse(studentToEdit.course_department);
      setYearLevel(studentToEdit.year_level);
      setEmail(studentToEdit.email || '');
      setContactNumber(studentToEdit.contact_number || '');
      setAvatarUrl(studentToEdit.avatar_url || '');
    } else {
      setIdNumber('');
      setFullName('');
      setCourse('BS Computer Science');
      setYearLevel('1st Year');
      setEmail('');
      setContactNumber('');
      setAvatarUrl('');
    }
    setError(null);
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber.trim() || !fullName.trim()) {
      setError('Student ID number and Full Name are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = studentToEdit ? `/api/students/${studentToEdit.id}` : '/api/students';
      const method = studentToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_number: idNumber.trim(),
          full_name: fullName.trim(),
          course_department: course.trim(),
          year_level: yearLevel,
          email: email.trim() || null,
          contact_number: contactNumber.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save student.');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">
            {studentToEdit ? 'Edit Student Profile' : 'Register New Student'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Student ID Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024-10099"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3 py-2 pl-9 font-mono rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Course / Department
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. BS Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Year Level
              </label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate / Masteral">Postgraduate / Masteral</option>
                <option value="Faculty / Staff">Faculty / Staff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Contact Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Avatar Image URL (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-xs rounded-lg border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
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
              {loading ? 'Saving...' : studentToEdit ? 'Save Changes' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
