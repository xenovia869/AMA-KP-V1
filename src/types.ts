export interface Student {
  id: number;
  id_number: string;
  full_name: string;
  email: string | null;
  course_department: string;
  year_level: string;
  contact_number: string | null;
  avatar_url: string | null;
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
  // Joined fields
  id_number?: string;
  full_name?: string;
  course_department?: string;
  year_level?: string;
  avatar_url?: string;
}

export interface StudentStats {
  total_visits: number;
  total_minutes: number;
  total_hours: string;
  average_minutes: number;
  currently_in: boolean;
  last_visit: string | null;
}

export interface NetworkInfo {
  hostname: string;
  platform: string;
  port: number;
  ip_addresses: { iface: string; address: string; family: string }[];
  local_url: string;
  primary_lan_url: string;
}

export interface ClockResponse {
  action_performed: 'IN' | 'OUT';
  student: Student;
  log: AttendanceLog;
  message: string;
}
