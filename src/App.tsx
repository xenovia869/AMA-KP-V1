/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KioskView } from './components/KioskView';
import { AttendanceView } from './components/AttendanceView';
import { StudentsView } from './components/StudentsView';
import { HostGuideView } from './components/HostGuideView';
import { StudentModal } from './components/StudentModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { Student, AttendanceLog, NetworkInfo } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'kiosk' | 'records' | 'students' | 'hosting'>('kiosk');
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state for records
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    }
  }, []);

  const fetchNetworkInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/system/network-info');
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
      }
    } catch (err) {
      console.error('Failed to load network info:', err);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([fetchStudents(), fetchLogs()]);
  }, [fetchStudents, fetchLogs]);

  useEffect(() => {
    Promise.all([fetchStudents(), fetchLogs(), fetchNetworkInfo()]).finally(() => {
      setLoading(false);
    });
  }, [fetchStudents, fetchLogs, fetchNetworkInfo]);

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleSelectStudentForLogs = (studentId: number) => {
    setSelectedStudentId(studentId);
    setActiveTab('records');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lanUrl={networkInfo?.primary_lan_url || 'http://localhost:3000'}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'kiosk' && (
          <KioskView
            students={students}
            onAttendanceUpdated={reloadAll}
            recentLogs={logs}
          />
        )}

        {activeTab === 'records' && (
          <AttendanceView
            students={students}
            logs={logs}
            onRefresh={reloadAll}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            onOpenAddModal={handleOpenAddStudent}
            onOpenEditModal={handleOpenEditStudent}
            onRefresh={reloadAll}
            onSelectStudentForLogs={handleSelectStudentForLogs}
          />
        )}

        {activeTab === 'hosting' && <HostGuideView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Chronos Local Attendance System · SQLite + Express Engine · Static IP Ready
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Database: attendance.db</span>
            <span>·</span>
            <span>Port: {networkInfo?.port || 3000}</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={reloadAll}
        studentToEdit={studentToEdit}
      />

      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={reloadAll}
        students={students}
      />
    </div>
  );
}
