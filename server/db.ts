import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

export interface Student {
  id: number;
  id_number: string;
  full_name: string;
  email: string;
  course_department: string;
  year_level: string;
  contact_number: string;
  avatar_url: string;
  active: number;
  created_at: string;
}

export interface AttendanceLog {
  id: number;
  student_id: number;
  time_in: string;
  time_out: string | null;
  duration_minutes: number | null;
  purpose: string;
  notes: string | null;
  station_device: string;
  status: 'IN' | 'OUT' | 'AUTO_CLOSED';
  created_at: string;
  // Joined student fields
  id_number?: string;
  full_name?: string;
  course_department?: string;
  year_level?: string;
  avatar_url?: string;
}

let dbInstance: Database | null = null;
const DB_PATH = path.resolve(process.cwd(), 'attendance.db');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Failed to load existing attendance.db, creating fresh one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize Schema
  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      course_department TEXT NOT NULL,
      year_level TEXT DEFAULT '1st Year',
      contact_number TEXT,
      avatar_url TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      time_in DATETIME NOT NULL,
      time_out DATETIME,
      duration_minutes INTEGER,
      purpose TEXT DEFAULT 'Class Session',
      notes TEXT,
      station_device TEXT DEFAULT 'Kiosk-Terminal-01',
      status TEXT DEFAULT 'IN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_logs(student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_time_in ON attendance_logs(time_in);
  `);

  // Check if students table is empty, if so, seed sample students
  const stmt = db.prepare('SELECT COUNT(*) as count FROM students');
  let count = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    count = Number(row.count) || 0;
  }
  stmt.free();

  if (count === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: Database): void {
  const seedStudents = [
    {
      id_number: '2024-10021',
      full_name: 'Sophia Elena Vance',
      email: 's.vance@university.edu',
      course_department: 'BS Computer Science',
      year_level: '3rd Year',
      contact_number: '+1 (555) 234-8901',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      id_number: '2024-10034',
      full_name: 'Marcus Alexander Hayes',
      email: 'm.hayes@university.edu',
      course_department: 'BS Information Technology',
      year_level: '2nd Year',
      contact_number: '+1 (555) 345-9012',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id_number: '2024-10048',
      full_name: 'Isabella Marie Chen',
      email: 'i.chen@university.edu',
      course_department: 'BS Computer Engineering',
      year_level: '4th Year',
      contact_number: '+1 (555) 456-0123',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id_number: '2024-10052',
      full_name: 'David Lucas Rivera',
      email: 'd.rivera@university.edu',
      course_department: 'BS Data Science',
      year_level: '1st Year',
      contact_number: '+1 (555) 567-1234',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      id_number: '2024-10067',
      full_name: 'Aaliyah Nicole Thorne',
      email: 'a.thorne@university.edu',
      course_department: 'BS Electronics Engineering',
      year_level: '3rd Year',
      contact_number: '+1 (555) 678-2345',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    {
      id_number: '2024-10089',
      full_name: 'Ethan Gabriel Bennett',
      email: 'e.bennett@university.edu',
      course_department: 'BS Cybersecurity',
      year_level: '2nd Year',
      contact_number: '+1 (555) 789-3456',
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    }
  ];

  for (const s of seedStudents) {
    db.run(
      `INSERT INTO students (id_number, full_name, email, course_department, year_level, contact_number, avatar_url, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [s.id_number, s.full_name, s.email, s.course_department, s.year_level, s.contact_number, s.avatar_url]
    );
  }

  // Seed sample logs from today and yesterday
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yestStr = yest.toISOString().split('T')[0];

  const sampleLogs = [
    {
      student_id: 1, // Sophia
      time_in: `${yestStr}T08:15:00`,
      time_out: `${yestStr}T12:30:00`,
      duration_minutes: 255,
      purpose: 'Morning Lab Session',
      status: 'OUT',
    },
    {
      student_id: 2, // Marcus
      time_in: `${yestStr}T09:00:00`,
      time_out: `${yestStr}T11:45:00`,
      duration_minutes: 165,
      purpose: 'Lecture & Practical',
      status: 'OUT',
    },
    {
      student_id: 3, // Isabella
      time_in: `${yestStr}T13:00:00`,
      time_out: `${yestStr}T17:15:00`,
      duration_minutes: 255,
      purpose: 'Capstone Project Research',
      status: 'OUT',
    },
    {
      student_id: 1, // Sophia
      time_in: `${todayStr}T08:00:00`,
      time_out: `${todayStr}T11:30:00`,
      duration_minutes: 210,
      purpose: 'Algorithm Analysis Lecture',
      status: 'OUT',
    },
    {
      student_id: 2, // Marcus
      time_in: `${todayStr}T08:45:00`,
      time_out: null,
      duration_minutes: null,
      purpose: 'Database Lab Session',
      status: 'IN', // Currently In!
    },
    {
      student_id: 4, // David
      time_in: `${todayStr}T09:15:00`,
      time_out: null,
      duration_minutes: null,
      purpose: 'Data Visualization Workshop',
      status: 'IN', // Currently In!
    }
  ];

  for (const log of sampleLogs) {
    db.run(
      `INSERT INTO attendance_logs (student_id, time_in, time_out, duration_minutes, purpose, station_device, status)
       VALUES (?, ?, ?, ?, ?, 'Kiosk-Terminal-01', ?)`,
      [log.student_id, log.time_in, log.time_out, log.duration_minutes, log.purpose, log.status]
    );
  }
}

// Helper methods
export async function getAllStudents(): Promise<Student[]> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM students ORDER BY full_name ASC');
  const students: Student[] = [];
  while (stmt.step()) {
    students.push(stmt.getAsObject() as unknown as Student);
  }
  stmt.free();
  return students;
}

export async function getStudentById(id: number): Promise<Student | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM students WHERE id = ?');
  stmt.bind([id]);
  let student: Student | null = null;
  if (stmt.step()) {
    student = stmt.getAsObject() as unknown as Student;
  }
  stmt.free();
  return student;
}

export async function getStudentByIdNumber(idNumber: string): Promise<Student | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM students WHERE LOWER(TRIM(id_number)) = LOWER(TRIM(?))');
  stmt.bind([idNumber]);
  let student: Student | null = null;
  if (stmt.step()) {
    student = stmt.getAsObject() as unknown as Student;
  }
  stmt.free();
  return student;
}

export async function createStudent(data: Partial<Student>): Promise<Student> {
  const db = await getDb();
  const idNumber = data.id_number?.trim() || '';
  const fullName = data.full_name?.trim() || '';
  db.run(
    `INSERT INTO students (id_number, full_name, email, course_department, year_level, contact_number, avatar_url, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      idNumber,
      fullName,
      data.email?.trim() || null,
      data.course_department?.trim() || 'General',
      data.year_level?.trim() || '1st Year',
      data.contact_number?.trim() || null,
      data.avatar_url?.trim() || null,
    ]
  );
  saveDb();

  const stmt = db.prepare('SELECT * FROM students WHERE id_number = ?');
  stmt.bind([idNumber]);
  stmt.step();
  const created = stmt.getAsObject() as unknown as Student;
  stmt.free();
  return created;
}

export async function updateStudent(id: number, data: Partial<Student>): Promise<Student | null> {
  const db = await getDb();
  db.run(
    `UPDATE students 
     SET id_number = COALESCE(?, id_number),
         full_name = COALESCE(?, full_name),
         email = COALESCE(?, email),
         course_department = COALESCE(?, course_department),
         year_level = COALESCE(?, year_level),
         contact_number = COALESCE(?, contact_number),
         avatar_url = COALESCE(?, avatar_url),
         active = COALESCE(?, active)
     WHERE id = ?`,
    [
      data.id_number?.trim() ?? null,
      data.full_name?.trim() ?? null,
      data.email?.trim() ?? null,
      data.course_department?.trim() ?? null,
      data.year_level?.trim() ?? null,
      data.contact_number?.trim() ?? null,
      data.avatar_url?.trim() ?? null,
      data.active !== undefined ? data.active : null,
      id
    ]
  );
  saveDb();
  return getStudentById(id);
}

export async function deleteStudent(id: number): Promise<boolean> {
  const db = await getDb();
  db.run('DELETE FROM attendance_logs WHERE student_id = ?', [id]);
  db.run('DELETE FROM students WHERE id = ?', [id]);
  saveDb();
  return true;
}

export async function getActiveLogForStudent(studentId: number): Promise<AttendanceLog | null> {
  const db = await getDb();
  const stmt = db.prepare(`
    SELECT * FROM attendance_logs 
    WHERE student_id = ? AND status = 'IN' AND time_out IS NULL 
    ORDER BY time_in DESC LIMIT 1
  `);
  stmt.bind([studentId]);
  let log: AttendanceLog | null = null;
  if (stmt.step()) {
    log = stmt.getAsObject() as unknown as AttendanceLog;
  }
  stmt.free();
  return log;
}

export async function getAttendanceLogs(filters: {
  student_id?: number;
  id_number?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  search?: string;
  limit?: number;
}): Promise<AttendanceLog[]> {
  const db = await getDb();
  let sql = `
    SELECT l.*, s.id_number, s.full_name, s.course_department, s.year_level, s.avatar_url
    FROM attendance_logs l
    JOIN students s ON l.student_id = s.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters.student_id) {
    sql += ' AND l.student_id = ?';
    params.push(filters.student_id);
  }

  if (filters.id_number) {
    sql += ' AND LOWER(TRIM(s.id_number)) = LOWER(TRIM(?))';
    params.push(filters.id_number);
  }

  if (filters.start_date) {
    sql += ' AND l.time_in >= ?';
    params.push(`${filters.start_date}T00:00:00`);
  }

  if (filters.end_date) {
    sql += ' AND l.time_in <= ?';
    params.push(`${filters.end_date}T23:59:59`);
  }

  if (filters.status && filters.status !== 'ALL') {
    sql += ' AND l.status = ?';
    params.push(filters.status);
  }

  if (filters.search) {
    sql += ' AND (s.full_name LIKE ? OR s.id_number LIKE ? OR s.course_department LIKE ? OR l.purpose LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY l.time_in DESC';

  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: AttendanceLog[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as AttendanceLog);
  }
  stmt.free();
  return results;
}

export async function recordClockAction(params: {
  student_identifier: string; // can be id_number or numeric id
  action?: 'in' | 'out' | 'auto';
  purpose?: string;
  notes?: string;
  station_device?: string;
}): Promise<{
  action_performed: 'IN' | 'OUT';
  student: Student;
  log: AttendanceLog;
  message: string;
}> {
  const db = await getDb();

  // Find student
  let student: Student | null = null;
  const numId = parseInt(params.student_identifier, 10);
  if (!isNaN(numId) && String(numId) === params.student_identifier) {
    student = await getStudentById(numId);
  }
  if (!student) {
    student = await getStudentByIdNumber(params.student_identifier);
  }

  if (!student) {
    throw new Error(`Student with ID "${params.student_identifier}" was not found in the database.`);
  }

  const now = new Date();
  const nowIso = now.toISOString().replace('Z', ''); // Local ISO representation
  const activeLog = await getActiveLogForStudent(student.id);

  let targetAction = params.action || 'auto';
  if (targetAction === 'auto') {
    targetAction = activeLog ? 'out' : 'in';
  }

  if (targetAction === 'out') {
    if (!activeLog) {
      throw new Error(`Cannot Time Out: Student ${student.full_name} (${student.id_number}) is not currently timed in.`);
    }

    const timeInDate = new Date(activeLog.time_in);
    const timeOutDate = now;
    const diffMs = timeOutDate.getTime() - timeInDate.getTime();
    const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

    db.run(
      `UPDATE attendance_logs 
       SET time_out = ?, duration_minutes = ?, status = 'OUT', notes = COALESCE(?, notes)
       WHERE id = ?`,
      [nowIso, durationMinutes, params.notes || null, activeLog.id]
    );
    saveDb();

    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    const durStr = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;

    const updatedLogStmt = db.prepare(`
      SELECT l.*, s.id_number, s.full_name, s.course_department, s.year_level, s.avatar_url
      FROM attendance_logs l
      JOIN students s ON l.student_id = s.id
      WHERE l.id = ?
    `);
    updatedLogStmt.bind([activeLog.id]);
    updatedLogStmt.step();
    const updatedLog = updatedLogStmt.getAsObject() as unknown as AttendanceLog;
    updatedLogStmt.free();

    return {
      action_performed: 'OUT',
      student,
      log: updatedLog,
      message: `Timed OUT successfully for ${student.full_name}. Session duration: ${durStr}.`,
    };
  } else {
    // Target is 'in'
    if (activeLog) {
      throw new Error(`Student ${student.full_name} (${student.id_number}) is ALREADY timed in since ${new Date(activeLog.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    }

    db.run(
      `INSERT INTO attendance_logs (student_id, time_in, purpose, notes, station_device, status)
       VALUES (?, ?, ?, ?, ?, 'IN')`,
      [
        student.id,
        nowIso,
        params.purpose || 'Regular Campus / Lab Visit',
        params.notes || null,
        params.station_device || 'Kiosk-Terminal-01'
      ]
    );
    saveDb();

    const stmt = db.prepare(`
      SELECT l.*, s.id_number, s.full_name, s.course_department, s.year_level, s.avatar_url
      FROM attendance_logs l
      JOIN students s ON l.student_id = s.id
      WHERE l.student_id = ? AND l.status = 'IN'
      ORDER BY l.time_in DESC LIMIT 1
    `);
    stmt.bind([student.id]);
    stmt.step();
    const newLog = stmt.getAsObject() as unknown as AttendanceLog;
    stmt.free();

    return {
      action_performed: 'IN',
      student,
      log: newLog,
      message: `Timed IN successfully for ${student.full_name} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    };
  }
}

export async function createManualLog(data: {
  student_id: number;
  time_in: string;
  time_out?: string;
  purpose?: string;
  notes?: string;
}): Promise<AttendanceLog> {
  const db = await getDb();
  let durationMinutes: number | null = null;
  let status = 'IN';

  if (data.time_out) {
    const tIn = new Date(data.time_in).getTime();
    const tOut = new Date(data.time_out).getTime();
    if (tOut > tIn) {
      durationMinutes = Math.round((tOut - tIn) / (1000 * 60));
      status = 'OUT';
    }
  }

  db.run(
    `INSERT INTO attendance_logs (student_id, time_in, time_out, duration_minutes, purpose, notes, station_device, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Admin-Manual-Entry', ?)`,
    [
      data.student_id,
      data.time_in,
      data.time_out || null,
      durationMinutes,
      data.purpose || 'Manual Attendance Record',
      data.notes || null,
      status
    ]
  );
  saveDb();

  const stmt = db.prepare(`
    SELECT l.*, s.id_number, s.full_name, s.course_department, s.year_level, s.avatar_url
    FROM attendance_logs l
    JOIN students s ON l.student_id = s.id
    ORDER BY l.id DESC LIMIT 1
  `);
  stmt.step();
  const created = stmt.getAsObject() as unknown as AttendanceLog;
  stmt.free();
  return created;
}

export async function deleteAttendanceLog(id: number): Promise<boolean> {
  const db = await getDb();
  db.run('DELETE FROM attendance_logs WHERE id = ?', [id]);
  saveDb();
  return true;
}

export async function getStudentStats(studentId: number): Promise<{
  total_visits: number;
  total_minutes: number;
  total_hours: string;
  average_minutes: number;
  currently_in: boolean;
  last_visit: string | null;
}> {
  const logs = await getAttendanceLogs({ student_id: studentId });
  let totalMinutes = 0;
  let closedVisits = 0;
  let isCurrentlyIn = false;
  let lastVisit: string | null = null;

  for (const log of logs) {
    if (!lastVisit) lastVisit = log.time_in;
    if (log.status === 'IN' && !log.time_out) {
      isCurrentlyIn = true;
    }
    if (log.duration_minutes) {
      totalMinutes += log.duration_minutes;
      closedVisits++;
    }
  }

  const hours = (totalMinutes / 60).toFixed(1);
  const avg = closedVisits > 0 ? Math.round(totalMinutes / closedVisits) : 0;

  return {
    total_visits: logs.length,
    total_minutes: totalMinutes,
    total_hours: hours,
    average_minutes: avg,
    currently_in: isCurrentlyIn,
    last_visit: lastVisit,
  };
}

export function getRawDbBuffer(): Buffer | null {
  if (!fs.existsSync(DB_PATH)) return null;
  return fs.readFileSync(DB_PATH);
}
