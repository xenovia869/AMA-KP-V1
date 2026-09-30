import * as XLSX from 'xlsx';
import { AttendanceLog, Student, getStudentStats } from './db.js';

function formatTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return String(isoStr);
  }
}

function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(isoStr);
  }
}

function formatDurationHhMm(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '--';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export async function generateStudentExcelBuffer(
  student: Student,
  logs: AttendanceLog[],
  dateRangeStr?: string
): Promise<Buffer> {
  const stats = await getStudentStats(student.id);
  const wb = XLSX.utils.book_new();

  const generatedAt = new Date().toLocaleString();

  // Create a styled array-of-arrays worksheet
  const aoa: (string | number | null)[][] = [
    ['CHRONOS ATTENDANCE MANAGEMENT SYSTEM'],
    ['INDIVIDUAL STUDENT TIME-IN & TIME-OUT DOSSIER'],
    [`Generated: ${generatedAt}`, '', `Reporting Window: ${dateRangeStr || 'Complete History'}`],
    [],
    // Student Dossier Block
    ['STUDENT IDENTIFICATION RECORD', '', '', 'ATTENDANCE SUMMARY METRICS'],
    ['Student ID Number:', student.id_number, '', 'Total Recorded Visits:', stats.total_visits],
    ['Full Student Name:', student.full_name, '', 'Total Hours Rendered:', `${stats.total_hours} hrs`],
    ['Course / Department:', student.course_department, '', 'Average Session Duration:', `${stats.average_minutes} mins`],
    ['Year Level:', student.year_level, '', 'Current Campus Status:', stats.currently_in ? 'TIMED IN (Active)' : 'TIMED OUT (Off-site)'],
    ['Email Address:', student.email || 'N/A', '', 'Last Visit Logged:', stats.last_visit ? formatDate(stats.last_visit) : 'None'],
    ['Contact Number:', student.contact_number || 'N/A'],
    [],
    // Table Headers
    [
      'Record #',
      'Date',
      'Time In',
      'Time Out',
      'Duration (HH:MM)',
      'Total Minutes',
      'Session Status',
      'Purpose / Activity',
      'Station / Terminal',
      'Remarks / Notes'
    ]
  ];

  let sumMinutes = 0;

  logs.forEach((log, idx) => {
    const mins = log.duration_minutes ?? 0;
    if (log.duration_minutes) {
      sumMinutes += log.duration_minutes;
    }

    aoa.push([
      idx + 1,
      formatDate(log.time_in),
      formatTime(log.time_in),
      log.time_out ? formatTime(log.time_out) : '(Currently Active In)',
      log.duration_minutes !== null ? formatDurationHhMm(log.duration_minutes) : '--',
      log.duration_minutes !== null ? log.duration_minutes : '--',
      log.status === 'IN' ? 'ACTIVE / IN' : 'COMPLETED / OUT',
      log.purpose || 'Regular Attendance',
      log.station_device || 'Kiosk-Terminal-01',
      log.notes || ''
    ]);
  });

  // Summary Row
  aoa.push([]);
  const totalHrs = Math.floor(sumMinutes / 60);
  const remMins = sumMinutes % 60;
  aoa.push([
    'TOTALS',
    '',
    '',
    `${logs.length} Total Sessions`,
    `${String(totalHrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}`,
    sumMinutes,
    '',
    '',
    '',
    `Equivalent to ${(sumMinutes / 60).toFixed(2)} decimal hours`
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 }, // Record #
    { wch: 15 }, // Date
    { wch: 14 }, // Time In
    { wch: 18 }, // Time Out
    { wch: 18 }, // Duration HH:MM
    { wch: 15 }, // Total Mins
    { wch: 20 }, // Session Status
    { wch: 30 }, // Purpose
    { wch: 22 }, // Terminal
    { wch: 32 }, // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Log_${student.id_number.substring(0, 10)}`);

  // Secondary Sheet: Raw Data for Data Analysis / VLOOKUP
  const rawDataRows = logs.map(l => ({
    Record_ID: l.id,
    Student_ID: student.id_number,
    Student_Name: student.full_name,
    Course_Dept: student.course_department,
    Time_In_ISO: l.time_in,
    Time_Out_ISO: l.time_out || '',
    Duration_Minutes: l.duration_minutes || 0,
    Status: l.status,
    Purpose: l.purpose,
    Station: l.station_device
  }));
  const wsRaw = XLSX.utils.json_to_sheet(rawDataRows);
  XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw_Dataset');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf as Buffer;
}

export async function generateMasterAttendanceExcelBuffer(
  logs: AttendanceLog[],
  title = 'Master Attendance Log'
): Promise<Buffer> {
  const wb = XLSX.utils.book_new();
  const generatedAt = new Date().toLocaleString();

  const aoa: (string | number | null)[][] = [
    ['CHRONOS ATTENDANCE SYSTEM - MASTER ATTENDANCE LOG'],
    [`Generated: ${generatedAt}`, '', `Total Records: ${logs.length}`],
    [],
    [
      'Record #',
      'Date',
      'Student ID',
      'Student Name',
      'Department / Course',
      'Year Level',
      'Time In',
      'Time Out',
      'Duration (HH:MM)',
      'Duration (Mins)',
      'Status',
      'Purpose / Activity',
      'Station / Terminal',
      'Notes'
    ]
  ];

  let totalMinutes = 0;

  logs.forEach((log, index) => {
    if (log.duration_minutes) {
      totalMinutes += log.duration_minutes;
    }

    aoa.push([
      index + 1,
      formatDate(log.time_in),
      log.id_number || 'N/A',
      log.full_name || 'N/A',
      log.course_department || 'N/A',
      log.year_level || 'N/A',
      formatTime(log.time_in),
      log.time_out ? formatTime(log.time_out) : '(Currently In)',
      log.duration_minutes !== null ? formatDurationHhMm(log.duration_minutes) : '--',
      log.duration_minutes !== null ? log.duration_minutes : '--',
      log.status === 'IN' ? 'ACTIVE' : 'COMPLETED',
      log.purpose || 'Attendance',
      log.station_device || 'Kiosk-Terminal-01',
      log.notes || ''
    ]);
  });

  aoa.push([]);
  const totHrs = Math.floor(totalMinutes / 60);
  const totRemMins = totalMinutes % 60;
  aoa.push([
    'TOTALS',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    `${String(totHrs).padStart(2, '0')}:${String(totRemMins).padStart(2, '0')}`,
    totalMinutes,
    '',
    '',
    '',
    `Total Time: ${(totalMinutes / 60).toFixed(2)} hours`
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 10 }, // Record
    { wch: 14 }, // Date
    { wch: 15 }, // Student ID
    { wch: 25 }, // Name
    { wch: 26 }, // Department
    { wch: 12 }, // Year
    { wch: 14 }, // Time In
    { wch: 16 }, // Time Out
    { wch: 18 }, // Duration HH:MM
    { wch: 15 }, // Duration Mins
    { wch: 14 }, // Status
    { wch: 25 }, // Purpose
    { wch: 20 }, // Station
    { wch: 25 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Logs');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf as Buffer;
}
