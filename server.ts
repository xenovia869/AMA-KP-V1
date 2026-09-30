import express from 'express';
import { createServer as createViteServer } from 'vite';
import os from 'os';
import path from 'path';
import {
  getAllStudents,
  getStudentById,
  getStudentByIdNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  getAttendanceLogs,
  recordClockAction,
  createManualLog,
  deleteAttendanceLog,
  getStudentStats,
  getRawDbBuffer,
  getDb
} from './server/db.js';
import { generateStudentExcelBuffer, generateMasterAttendanceExcelBuffer } from './server/excel.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize SQLite DB on startup
getDb().then(() => {
  console.log('[SQLite] attendance.db ready and schema initialized.');
}).catch((err) => {
  console.error('[SQLite] Failed to initialize DB:', err);
});

// API Routes

// 1. Get system network interfaces & hosting info
app.get('/api/system/network-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses: { iface: string; address: string; family: string }[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          iface: name,
          address: net.address,
          family: net.family
        });
      }
    }
  }

  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    port: PORT,
    ip_addresses: addresses,
    local_url: `http://localhost:${PORT}`,
    primary_lan_url: addresses.length > 0 ? `http://${addresses[0].address}:${PORT}` : `http://localhost:${PORT}`,
  });
});

// 2. Students management
app.get('/api/students', async (req, res) => {
  try {
    const students = await getAllStudents();
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const student = await getStudentById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const stats = await getStudentStats(id);
    res.json({ ...student, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { id_number, full_name, email, course_department, year_level, contact_number, avatar_url } = req.body;
    if (!id_number || !full_name) {
      return res.status(400).json({ error: 'Student ID and Full Name are required.' });
    }

    const existing = await getStudentByIdNumber(id_number);
    if (existing) {
      return res.status(409).json({ error: `A student with ID ${id_number} already exists.` });
    }

    const created = await createStudent({
      id_number,
      full_name,
      email,
      course_department,
      year_level,
      contact_number,
      avatar_url
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateStudent(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteStudent(id);
    res.json({ success: true, message: 'Student and attendance records deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/:id/stats', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const stats = await getStudentStats(id);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Attendance Logs
app.get('/api/attendance', async (req, res) => {
  try {
    const { student_id, id_number, start_date, end_date, status, search, limit } = req.query;
    const logs = await getAttendanceLogs({
      student_id: student_id ? parseInt(student_id as string, 10) : undefined,
      id_number: id_number ? String(id_number) : undefined,
      start_date: start_date ? String(start_date) : undefined,
      end_date: end_date ? String(end_date) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Dynamic Time In / Time Out Clocking
app.post('/api/attendance/clock', async (req, res) => {
  try {
    const { student_identifier, action, purpose, notes, station_device } = req.body;
    if (!student_identifier) {
      return res.status(400).json({ error: 'Student ID or Number is required.' });
    }

    const result = await recordClockAction({
      student_identifier: String(student_identifier),
      action: action || 'auto',
      purpose,
      notes,
      station_device: station_device || 'Kiosk-Terminal-01'
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Manual past / corrected attendance entry
app.post('/api/attendance/manual', async (req, res) => {
  try {
    const { student_id, time_in, time_out, purpose, notes } = req.body;
    if (!student_id || !time_in) {
      return res.status(400).json({ error: 'Student and Time In are required.' });
    }

    const log = await createManualLog({
      student_id: parseInt(student_id, 10),
      time_in,
      time_out,
      purpose,
      notes,
    });

    res.status(201).json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete attendance record
app.delete('/api/attendance/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteAttendanceLog(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. EXCEL EXPORT ENDPOINT (.xlsx)
// Supports specific student by student_id or id_number, or filtered master report
app.get('/api/export/excel', async (req, res) => {
  try {
    const { student_id, id_number, start_date, end_date, status, search } = req.query;

    let targetStudent = null;
    if (student_id) {
      targetStudent = await getStudentById(parseInt(student_id as string, 10));
    } else if (id_number) {
      targetStudent = await getStudentByIdNumber(String(id_number));
    }

    const logs = await getAttendanceLogs({
      student_id: targetStudent ? targetStudent.id : undefined,
      start_date: start_date ? String(start_date) : undefined,
      end_date: end_date ? String(end_date) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
    });

    const nowStr = new Date().toISOString().split('T')[0];

    if (targetStudent) {
      // Individual Student Dossier Export
      const dateRangeStr = start_date && end_date 
        ? `${start_date} to ${end_date}`
        : (start_date ? `From ${start_date}` : 'All Recorded Dates');

      const buffer = await generateStudentExcelBuffer(targetStudent, logs, dateRangeStr);
      const safeName = targetStudent.full_name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Attendance_${targetStudent.id_number}_${safeName}_${nowStr}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    } else {
      // Master Attendance Export
      const buffer = await generateMasterAttendanceExcelBuffer(logs, 'Master Attendance Report');
      const filename = `Attendance_Master_Log_${nowStr}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }
  } catch (err: any) {
    console.error('Excel generation error:', err);
    res.status(500).json({ error: `Excel generation failed: ${err.message}` });
  }
});

// 8. Download raw SQLite Database file
app.get('/api/db/download', (req, res) => {
  try {
    const buffer = getRawDbBuffer();
    if (!buffer) {
      return res.status(404).json({ error: 'attendance.db file not found yet.' });
    }
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance.db"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup Vite Middlewares in Dev mode or serve static files in Production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Chronos Server] Running at http://localhost:${PORT}`);
    console.log(`[Chronos Server] LAN Static IP access enabled on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
});
