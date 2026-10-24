/**
 * EduCore Canonical Pure-Digit 11-12 Digit UID Architecture
 * Specification:
 * - 1st digit: Server ID (e.g. 1 = Primary Production Node)
 * - Next 2 digits: Client Number (e.g. 01 = Bathinda Main, 02 = Faridkot Regional)
 * - Next 2 digits: Session ID (e.g. 26 = 2026 Intake, 25 = 2025 Current Session)
 * - Next 2 digits: Course ID (e.g. 01 = B.Tech CSE, 02 = B.Tech ME, 05 = MBA, 07 = B.Sc Agri)
 * - Next 4 digits: Student Number (e.g. 0001, 0002, 0042...)
 * 
 * Total: 11-12 digits pure numeric!
 * Formatted: S-CC-SS-CO-NNNN (e.g. 1-01-26-01-0001 or pure digits 10126010001 / 010126010001)
 */

export interface StudentUIDComponents {
  server: number | string;     // 1 or 2 digits (e.g. 1 or '01')
  client: string;              // 2 digits (e.g. '01')
  session: string;             // 2 digits (e.g. '26' for 2026)
  course: string;              // 2 digits (e.g. '01' for CSE)
  studentNumber: string;       // 4 digits (e.g. '0001')
}

export const COURSE_ID_MAP: Record<string, string> = {
  'cse': '01',
  'btech_cse': '01',
  'b.tech computer science & engineering': '01',
  'me': '02',
  'btech_me': '02',
  'b.tech mechanical engineering': '02',
  'ce': '03',
  'btech_ce': '03',
  'b.tech civil engineering': '03',
  'ee': '04',
  'btech_ee': '04',
  'b.tech electrical engineering': '04',
  'mba': '05',
  'master of business administration': '05',
  'pharm': '06',
  'bpharm': '06',
  'bachelor of pharmacy': '06',
  'agri': '07',
  'bsc_agri': '07',
  'b.sc (hons) agriculture sciences': '07',
  'bca': '08',
  'bachelor of computer applications': '08',
  'mca': '09',
  'mtech_cse': '10',
};

export const CLIENT_ID_MAP: Record<string, string> = {
  'campus_01': '01',
  'bathinda': '01',
  'main': '01',
  'campus_02': '02',
  'faridkot': '02',
  'regional': '02',
  'campus_03': '03',
  'malwa': '03',
};

/**
 * Generate a canonical pure-digit 11-12 digit Student UID
 */
export function generateStudentUID(params: {
  server?: number | string;
  client?: string;
  session?: string;
  course?: string;
  studentNumber: number | string;
  useTwelveDigits?: boolean;
}): string {
  const server = params.server !== undefined ? String(params.server) : '1';
  const client = (params.client || '01').padStart(2, '0').slice(-2);
  const session = (params.session || '26').padStart(2, '0').slice(-2);
  const course = (params.course || '01').padStart(2, '0').slice(-2);
  const studentSeq = String(params.studentNumber).padStart(4, '0').slice(-4);

  if (params.useTwelveDigits || server.length === 2) {
    const server2 = server.padStart(2, '0').slice(-2);
    return `${server2}${client}${session}${course}${studentSeq}`;
  }
  return `${server}${client}${session}${course}${studentSeq}`;
}

/**
 * Format a pure-digit UID into segmented canonical format: 1-01-26-01-0001
 */
export function formatUIDWithDashes(uid: string): string {
  const clean = uid.replace(/[^0-9]/g, '');
  if (clean.length === 11) {
    // 1-CC-SS-CO-NNNN
    return `${clean.slice(0, 1)}-${clean.slice(1, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 12) {
    // SS-CC-SS-CO-NNNN
    return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}-${clean.slice(8)}`;
  }
  return uid;
}

/**
 * Parse UID into components
 */
export function parseUID(uid: string): StudentUIDComponents | null {
  const clean = uid.replace(/[^0-9]/g, '');
  if (clean.length === 11) {
    return {
      server: clean.slice(0, 1),
      client: clean.slice(1, 3),
      session: clean.slice(3, 5),
      course: clean.slice(5, 7),
      studentNumber: clean.slice(7, 11),
    };
  }
  if (clean.length === 12) {
    return {
      server: clean.slice(0, 2),
      client: clean.slice(2, 4),
      session: clean.slice(4, 6),
      course: clean.slice(6, 8),
      studentNumber: clean.slice(8, 12),
    };
  }
  return null;
}

/**
 * Generate Staff Employee ID (8 digits canonical: [Server 1][Client 2][Role 2][Seq 3])
 */
export function generateEmployeeUID(role: string, seq: number | string = 1, client: string = '01'): string {
  const roleCodeMap: Record<string, string> = {
    staff: '02',
    hod: '03',
    admin: '04',
    accounts: '05',
    counselor: '06',
    partner: '07',
    hr: '08',
    super_admin: '09',
    hostel: '10',
  };
  const roleCode = roleCodeMap[role] || '02';
  const cleanSeq = String(seq).padStart(3, '0').slice(-3);
  return `1${client}${roleCode}${cleanSeq}`;
}
