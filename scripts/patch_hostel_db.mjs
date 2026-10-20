import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'server', 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

// 1. Add Interfaces and DEFAULT arrays after DEFAULT_CAMPUSES definition
const campusMarker = 'export const DEFAULT_CAMPUSES: CampusRecord[] = [';
if (!content.includes('export interface HostelBuilding')) {
  const insertIndex = content.indexOf(campusMarker);
  if (insertIndex === -1) {
    throw new Error('Could not find DEFAULT_CAMPUSES marker in server/db.ts');
  }

  const hostelDefs = `
export interface HostelBuilding {
  id: string;
  campus_id: string;
  campus_name: string;
  name: string;
  code: string;
  address: string;
  location_type: 'in_campus' | 'off_campus';
  ownership: 'owned' | 'leased';
  vendor_name?: string;
  vendor_contact?: string;
  google_maps_url?: string;
  google_coordinates?: string;
  total_floors: number;
  total_rooms: number;
  maintenance_due_days: number;
  electrical_check_days: number;
  last_maintenance_date: string;
  last_electrical_inspection: string;
  inspected_by?: string;
  is_active: boolean;
}

export interface HostelRoom {
  id: string;
  building_id: string;
  building_name: string;
  floor_number: number;
  room_number: string;
  room_name?: string;
  capacity: number;
  current_occupancy: number;
  washroom_type: 'ARW' | 'FCW';
  has_window: boolean;
  is_ac: boolean;
  has_almirah: boolean;
  monthly_rent: number;
  semester_rent: number;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface HostelResident {
  id: string;
  student_uid: string;
  student_name: string;
  course_name: string;
  semester: number;
  building_id: string;
  building_name: string;
  room_id: string;
  room_number: string;
  room_name?: string;
  bed_number: number;
  allotted_date: string;
  billing_cycle: 'monthly' | 'semester';
  fee_status: 'paid' | 'pending' | 'due';
  amount_due: number;
  mess_enrolled: boolean;
  mess_status: 'active' | 'cleared' | 'dues_pending';
  mess_dues_amount: number;
  has_transport: boolean;
  guardian_contact: string;
}

export interface MessClearanceRecord {
  id: string;
  student_uid: string;
  student_name: string;
  room_number: string;
  building_name: string;
  diet_count_monthly: number;
  outstanding_balance: number;
  clearance_status: 'cleared' | 'dues_pending' | 'rejected';
  signed_by_mess_manager: string;
  clearance_timestamp: string;
  caution_deposit_refund_eligible: boolean;
  remarks: string;
}

export const DEFAULT_HOSTEL_BUILDINGS: HostelBuilding[] = [
  {
    id: 'bld-01',
    campus_id: 'campus_01',
    campus_name: 'Bathinda Campus 01 (Main)',
    name: 'Shaheed Bhagat Singh Residence Block A',
    code: 'SBS-A',
    address: 'Main Campus, Muktsar Road, Bathinda, Punjab',
    location_type: 'in_campus',
    ownership: 'owned',
    total_floors: 4,
    total_rooms: 48,
    maintenance_due_days: 142,
    electrical_check_days: 12,
    last_maintenance_date: '2026-03-10',
    last_electrical_inspection: '2026-07-28',
    inspected_by: 'Er. Harminder Singh (Chief Electrical Officer)',
    google_maps_url: 'https://maps.google.com/?q=30.2109,74.9455',
    is_active: true,
  },
  {
    id: 'bld-02',
    campus_id: 'campus_01',
    campus_name: 'Bathinda Campus 01 (Main)',
    name: 'Mata Gujri Girls Hostel Block B',
    code: 'MG-B',
    address: 'North Enclave, Main Campus, Bathinda, Punjab',
    location_type: 'in_campus',
    ownership: 'owned',
    total_floors: 3,
    total_rooms: 36,
    maintenance_due_days: 18,
    electrical_check_days: 4,
    last_maintenance_date: '2025-10-25',
    last_electrical_inspection: '2026-07-15',
    inspected_by: 'Er. Jaspreet Kaur (Safety Auditor)',
    google_maps_url: 'https://maps.google.com/?q=30.2115,74.9460',
    is_active: true,
  },
  {
    id: 'bld-03',
    campus_id: 'campus_01',
    campus_name: 'Bathinda Campus 01 (Main)',
    name: 'Baba Deep Singh Scholar Enclave Block C',
    code: 'BDS-C',
    address: 'Ring Road Campus Extension, Bathinda, Punjab',
    location_type: 'off_campus',
    ownership: 'leased',
    vendor_name: 'Malwa Infrastructure & Hospitality Pvt Ltd',
    vendor_contact: '+91 98765 43210 (Mr. Sandhu)',
    total_floors: 5,
    total_rooms: 60,
    maintenance_due_days: 210,
    electrical_check_days: 45,
    last_maintenance_date: '2026-05-18',
    last_electrical_inspection: '2026-09-02',
    inspected_by: 'Vendor Authorized Inspector - Er. R. Verma',
    google_maps_url: 'https://maps.google.com/?q=30.2150,74.9480',
    is_active: true,
  },
  {
    id: 'bld-04',
    campus_id: 'campus_02',
    campus_name: 'Faridkot Campus 02 (Regional)',
    name: 'Faridkot Regional Residence Block A',
    code: 'FDK-A',
    address: 'Talwandi Road, Faridkot, Punjab',
    location_type: 'in_campus',
    ownership: 'owned',
    total_floors: 3,
    total_rooms: 24,
    maintenance_due_days: 90,
    electrical_check_days: 20,
    last_maintenance_date: '2026-04-12',
    last_electrical_inspection: '2026-08-10',
    inspected_by: 'Er. Jaswant Singh (Faridkot Site Lead)',
    google_maps_url: 'https://maps.google.com/?q=30.6769,74.7583',
    is_active: true,
  },
];

export const DEFAULT_HOSTEL_ROOMS: HostelRoom[] = [
  {
    id: 'rm-101',
    building_id: 'bld-01',
    building_name: 'SBS-A',
    floor_number: 1,
    room_number: '101',
    room_name: 'Guru Mahal Suite',
    capacity: 2,
    current_occupancy: 2,
    washroom_type: 'ARW',
    is_ac: true,
    has_window: true,
    has_almirah: true,
    monthly_rent: 7500,
    semester_rent: 42000,
    status: 'occupied',
  },
  {
    id: 'rm-102',
    building_id: 'bld-01',
    building_name: 'SBS-A',
    floor_number: 1,
    room_number: '102',
    room_name: 'Baljinder Memorial Room',
    capacity: 3,
    current_occupancy: 2,
    washroom_type: 'FCW',
    is_ac: false,
    has_window: true,
    has_almirah: true,
    monthly_rent: 5500,
    semester_rent: 30000,
    status: 'available',
  },
  {
    id: 'rm-103',
    building_id: 'bld-01',
    building_name: 'SBS-A',
    floor_number: 1,
    room_number: '103',
    room_name: 'Falcon Wing 103',
    capacity: 4,
    current_occupancy: 4,
    washroom_type: 'FCW',
    is_ac: false,
    has_window: false,
    has_almirah: true,
    monthly_rent: 4500,
    semester_rent: 24000,
    status: 'occupied',
  },
  {
    id: 'rm-201',
    building_id: 'bld-02',
    building_name: 'MG-B',
    floor_number: 2,
    room_number: '201',
    room_name: 'Kalpana Chawla Room',
    capacity: 2,
    current_occupancy: 1,
    washroom_type: 'ARW',
    is_ac: true,
    has_window: true,
    has_almirah: true,
    monthly_rent: 7500,
    semester_rent: 42000,
    status: 'available',
  },
  {
    id: 'rm-301',
    building_id: 'bld-03',
    building_name: 'BDS-C',
    floor_number: 3,
    room_number: '301',
    room_name: 'Pinecrest Leased Suite 301',
    capacity: 2,
    current_occupancy: 0,
    washroom_type: 'ARW',
    is_ac: true,
    has_window: true,
    has_almirah: true,
    monthly_rent: 8000,
    semester_rent: 45000,
    status: 'available',
  },
  {
    id: 'rm-401',
    building_id: 'bld-04',
    building_name: 'FDK-A',
    floor_number: 1,
    room_number: '101',
    room_name: 'Faridkot Scholars Suite',
    capacity: 2,
    current_occupancy: 1,
    washroom_type: 'ARW',
    is_ac: true,
    has_window: true,
    has_almirah: true,
    monthly_rent: 6500,
    semester_rent: 38000,
    status: 'available',
  },
];

export const DEFAULT_HOSTEL_RESIDENTS: HostelResident[] = [
  {
    id: 'res-01',
    student_uid: '1001-88-03-01',
    student_name: 'Aryan Sharma',
    course_name: 'B.Tech Computer Science & Engg',
    semester: 4,
    building_id: 'bld-01',
    building_name: 'SBS-A',
    room_id: 'rm-101',
    room_number: '101',
    room_name: 'Guru Mahal Suite',
    bed_number: 1,
    allotted_date: '2025-08-01',
    billing_cycle: 'semester',
    fee_status: 'paid',
    amount_due: 0,
    mess_enrolled: true,
    mess_status: 'cleared',
    mess_dues_amount: 0,
    has_transport: false,
    guardian_contact: '+91 98141 12345',
  },
  {
    id: 'res-02',
    student_uid: '1001-01-02-03-01',
    student_name: 'Gurpreet Singh Dhillon',
    course_name: 'B.Tech Mechanical Engg',
    semester: 4,
    building_id: 'bld-01',
    building_name: 'SBS-A',
    room_id: 'rm-101',
    room_number: '101',
    room_name: 'Guru Mahal Suite',
    bed_number: 2,
    allotted_date: '2025-08-01',
    billing_cycle: 'semester',
    fee_status: 'paid',
    amount_due: 0,
    mess_enrolled: true,
    mess_status: 'active',
    mess_dues_amount: 1450,
    has_transport: true,
    guardian_contact: '+91 98722 54321',
  },
  {
    id: 'res-03',
    student_uid: '1001-01-03-03-01',
    student_name: 'Navjot Kaur Brar',
    course_name: 'BCA Cloud Technology',
    semester: 2,
    building_id: 'bld-02',
    building_name: 'MG-B',
    room_id: 'rm-201',
    room_number: '201',
    room_name: 'Kalpana Chawla Room',
    bed_number: 1,
    allotted_date: '2025-08-15',
    billing_cycle: 'monthly',
    fee_status: 'due',
    amount_due: 7500,
    mess_enrolled: true,
    mess_status: 'dues_pending',
    mess_dues_amount: 3200,
    has_transport: false,
    guardian_contact: '+91 94178 88990',
  },
  {
    id: 'res-04',
    student_uid: '1001-01-04-03-01',
    student_name: 'Simranjit Singh',
    course_name: 'B.Tech CSE',
    semester: 6,
    building_id: 'bld-01',
    building_name: 'SBS-A',
    room_id: 'rm-102',
    room_number: '102',
    room_name: 'Baljinder Memorial Room',
    bed_number: 1,
    allotted_date: '2025-08-01',
    billing_cycle: 'semester',
    fee_status: 'paid',
    amount_due: 0,
    mess_enrolled: true,
    mess_status: 'active',
    mess_dues_amount: 0,
    has_transport: true,
    guardian_contact: '+91 98888 11223',
  },
];

export const DEFAULT_HOSTEL_MESS_CLEARANCES: MessClearanceRecord[] = [
  {
    id: 'mc-01',
    student_uid: '1001-88-03-01',
    student_name: 'Aryan Sharma',
    room_number: '101',
    building_name: 'SBS-A',
    diet_count_monthly: 56,
    outstanding_balance: 0,
    clearance_status: 'cleared',
    signed_by_mess_manager: 'S. Kulwinder Singh (Chief Steward)',
    clearance_timestamp: '2026-10-18 14:30 IST',
    caution_deposit_refund_eligible: true,
    remarks: 'Zero diet arrears. Kitchen linen and dining utensils surrendered.',
  },
];
`;
  content = content.slice(0, insertIndex) + hostelDefs + content.slice(insertIndex);
}

// 2. Add class fields to DatabaseStore
if (!content.includes('public hostel_buildings: HostelBuilding[] = [];')) {
  const target = 'public locked_attendance_registers: LockedAttendanceRegister[] = [];';
  const replacement = `${target}
  public hostel_buildings: HostelBuilding[] = [];
  public hostel_rooms: HostelRoom[] = [];
  public hostel_residents: HostelResident[] = [];
  public hostel_mess_clearances: MessClearanceRecord[] = [];`;
  content = content.replace(target, replacement);
}

// 3. Add to seedDefaultsInMemory
if (!content.includes('this.hostel_buildings = [...DEFAULT_HOSTEL_BUILDINGS];')) {
  const target = 'this.locked_attendance_registers = [...DEFAULT_LOCKED_REGISTERS];';
  const replacement = `${target}
    this.hostel_buildings = [...DEFAULT_HOSTEL_BUILDINGS];
    this.hostel_rooms = [...DEFAULT_HOSTEL_ROOMS];
    this.hostel_residents = [...DEFAULT_HOSTEL_RESIDENTS];
    this.hostel_mess_clearances = [...DEFAULT_HOSTEL_MESS_CLEARANCES];`;
  content = content.replace(target, replacement);
}

// 4. Add SQLite table creation in createSqliteTables()
if (!content.includes('CREATE TABLE IF NOT EXISTS hostel_buildings')) {
  const target = `      CREATE TABLE IF NOT EXISTS dialer_settings (
        id TEXT PRIMARY KEY, is_enabled INTEGER, provider TEXT, api_key_configured INTEGER
      );`;
  const replacement = `${target}
      CREATE TABLE IF NOT EXISTS hostel_buildings (
        id TEXT PRIMARY KEY, campus_id TEXT, campus_name TEXT, name TEXT, code TEXT, address TEXT, location_type TEXT, ownership TEXT, vendor_name TEXT, vendor_contact TEXT, google_maps_url TEXT, google_coordinates TEXT, total_floors INTEGER, total_rooms INTEGER, maintenance_due_days INTEGER, electrical_check_days INTEGER, last_maintenance_date TEXT, last_electrical_inspection TEXT, inspected_by TEXT, is_active INTEGER
      );
      CREATE TABLE IF NOT EXISTS hostel_rooms (
        id TEXT PRIMARY KEY, building_id TEXT, building_name TEXT, floor_number INTEGER, room_number TEXT, room_name TEXT, capacity INTEGER, current_occupancy INTEGER, washroom_type TEXT, has_window INTEGER, is_ac INTEGER, has_almirah INTEGER, monthly_rent REAL, semester_rent REAL, status TEXT
      );
      CREATE TABLE IF NOT EXISTS hostel_residents (
        id TEXT PRIMARY KEY, student_uid TEXT, student_name TEXT, course_name TEXT, semester INTEGER, building_id TEXT, building_name TEXT, room_id TEXT, room_number TEXT, room_name TEXT, bed_number INTEGER, allotted_date TEXT, billing_cycle TEXT, fee_status TEXT, amount_due REAL, mess_enrolled INTEGER, mess_status TEXT, mess_dues_amount REAL, has_transport INTEGER, guardian_contact TEXT
      );
      CREATE TABLE IF NOT EXISTS hostel_mess_clearances (
        id TEXT PRIMARY KEY, student_uid TEXT, student_name TEXT, room_number TEXT, building_name TEXT, diet_count_monthly INTEGER, outstanding_balance REAL, clearance_status TEXT, signed_by_mess_manager TEXT, clearance_timestamp TEXT, caution_deposit_refund_eligible INTEGER, remarks TEXT
      );`;
  content = content.replace(target, replacement);
}

// 5. Add loadFromSqlite handling
if (!content.includes('this.hostel_buildings = readTable(\'hostel_buildings\')')) {
  const target = `        try {
          this.campuses = readTable('campuses').map(c => ({ ...c, is_main: Boolean(c.is_main), is_active: Boolean(c.is_active) }));
          if (this.campuses.length === 0) this.campuses = [...DEFAULT_CAMPUSES];
        } catch { this.campuses = [...DEFAULT_CAMPUSES]; }`;
  const replacement = `${target}
        try {
          this.hostel_buildings = readTable('hostel_buildings').map(b => ({ ...b, is_active: Boolean(b.is_active) }));
          if (this.hostel_buildings.length === 0) this.hostel_buildings = [...DEFAULT_HOSTEL_BUILDINGS];
        } catch { this.hostel_buildings = [...DEFAULT_HOSTEL_BUILDINGS]; }
        try {
          this.hostel_rooms = readTable('hostel_rooms').map(r => ({ ...r, has_window: Boolean(r.has_window), is_ac: Boolean(r.is_ac), has_almirah: Boolean(r.has_almirah) }));
          if (this.hostel_rooms.length === 0) this.hostel_rooms = [...DEFAULT_HOSTEL_ROOMS];
        } catch { this.hostel_rooms = [...DEFAULT_HOSTEL_ROOMS]; }
        try {
          this.hostel_residents = readTable('hostel_residents').map(r => ({ ...r, mess_enrolled: Boolean(r.mess_enrolled), has_transport: Boolean(r.has_transport) }));
          if (this.hostel_residents.length === 0) this.hostel_residents = [...DEFAULT_HOSTEL_RESIDENTS];
        } catch { this.hostel_residents = [...DEFAULT_HOSTEL_RESIDENTS]; }
        try {
          this.hostel_mess_clearances = readTable('hostel_mess_clearances').map(m => ({ ...m, caution_deposit_refund_eligible: Boolean(m.caution_deposit_refund_eligible) }));
          if (this.hostel_mess_clearances.length === 0) this.hostel_mess_clearances = [...DEFAULT_HOSTEL_MESS_CLEARANCES];
        } catch { this.hostel_mess_clearances = [...DEFAULT_HOSTEL_MESS_CLEARANCES]; }`;
  content = content.replace(target, replacement);
}

// 6. Add saveToSqlite handling
if (!content.includes('clearAndInsert(\'hostel_buildings\',')) {
  const target = 'clearAndInsert(\'campuses\', this.campuses, [\'id\', \'tenant_id\', \'campus_code\', \'campus_name\', \'city\', \'state_code\', \'is_main\', \'is_active\', \'created_at\']);';
  const replacement = `${target}
      clearAndInsert('hostel_buildings', this.hostel_buildings, ['id', 'campus_id', 'campus_name', 'name', 'code', 'address', 'location_type', 'ownership', 'vendor_name', 'vendor_contact', 'google_maps_url', 'google_coordinates', 'total_floors', 'total_rooms', 'maintenance_due_days', 'electrical_check_days', 'last_maintenance_date', 'last_electrical_inspection', 'inspected_by', 'is_active']);
      clearAndInsert('hostel_rooms', this.hostel_rooms, ['id', 'building_id', 'building_name', 'floor_number', 'room_number', 'room_name', 'capacity', 'current_occupancy', 'washroom_type', 'has_window', 'is_ac', 'has_almirah', 'monthly_rent', 'semester_rent', 'status']);
      clearAndInsert('hostel_residents', this.hostel_residents, ['id', 'student_uid', 'student_name', 'course_name', 'semester', 'building_id', 'building_name', 'room_id', 'room_number', 'room_name', 'bed_number', 'allotted_date', 'billing_cycle', 'fee_status', 'amount_due', 'mess_enrolled', 'mess_status', 'mess_dues_amount', 'has_transport', 'guardian_contact']);
      clearAndInsert('hostel_mess_clearances', this.hostel_mess_clearances, ['id', 'student_uid', 'student_name', 'room_number', 'building_name', 'diet_count_monthly', 'outstanding_balance', 'clearance_status', 'signed_by_mess_manager', 'clearance_timestamp', 'caution_deposit_refund_eligible', 'remarks']);`;
  content = content.replace(target, replacement);
}

// 7. Add Hostel Store methods to DatabaseStore
if (!content.includes('public async getHostelBuildings')) {
  const storeMethods = `
  // --- HOSTEL & RESIDENTIAL MANAGEMENT (Karanvir Sir Lecture 4) ---
  public async getHostelBuildings(campus?: string): Promise<HostelBuilding[]> {
    if (this.pgPool) {
      const q = campus && campus !== 'all'
        ? 'SELECT * FROM hostel_buildings WHERE campus_id = $1 OR campus_id = $2 ORDER BY code ASC'
        : 'SELECT * FROM hostel_buildings ORDER BY code ASC';
      const params = campus && campus !== 'all' ? [campus, campus === 'campus_01' ? 'cmp-01' : 'cmp-02'] : [];
      const { rows } = await this.pgPool.query(q, params);
      if (rows.length > 0) return rows;
    }
    if (!campus || campus === 'all') return this.hostel_buildings;
    return this.hostel_buildings.filter(b => b.campus_id === campus || (campus === 'campus_01' && b.campus_id === 'cmp-01'));
  }

  public async createHostelBuilding(data: Partial<HostelBuilding>): Promise<HostelBuilding> {
    const id = data.id || \`bld-\${Date.now()}\`;
    const campus_id = data.campus_id || 'campus_01';
    const campus_name = data.campus_name || (campus_id === 'campus_02' ? 'Faridkot Campus 02 (Regional)' : 'Bathinda Campus 01 (Main)');
    const building: HostelBuilding = {
      id,
      campus_id,
      campus_name,
      name: data.name || 'New Hostel Residence Block',
      code: data.code || \`BLD-\${Math.floor(10 + Math.random() * 89)}\`,
      address: data.address || 'Campus Residential Enclave',
      location_type: data.location_type || 'in_campus',
      ownership: data.ownership || 'owned',
      vendor_name: data.vendor_name,
      vendor_contact: data.vendor_contact,
      total_floors: data.total_floors || 3,
      total_rooms: data.total_rooms || 24,
      maintenance_due_days: data.maintenance_due_days || 180,
      electrical_check_days: data.electrical_check_days || 30,
      last_maintenance_date: data.last_maintenance_date || new Date().toISOString().split('T')[0],
      last_electrical_inspection: data.last_electrical_inspection || new Date().toISOString().split('T')[0],
      inspected_by: data.inspected_by || 'Er. Harminder Singh (Chief Electrical Officer)',
      is_active: data.is_active !== undefined ? data.is_active : true,
    };
    this.hostel_buildings.unshift(building);
    this.save();
    return building;
  }

  public async getHostelRooms(buildingId?: string, campus?: string): Promise<HostelRoom[]> {
    if (this.pgPool) {
      let q = 'SELECT * FROM hostel_rooms WHERE 1=1';
      const params: any[] = [];
      if (buildingId && buildingId !== 'ALL') {
        params.push(buildingId);
        q += \` AND building_id = $\${params.length}\`;
      }
      q += ' ORDER BY room_number ASC';
      const { rows } = await this.pgPool.query(q, params);
      if (rows.length > 0) return rows;
    }
    let list = this.hostel_rooms;
    if (buildingId && buildingId !== 'ALL') {
      list = list.filter(r => r.building_id === buildingId);
    }
    return list;
  }

  public async createHostelRoom(data: Partial<HostelRoom>): Promise<HostelRoom> {
    const id = data.id || \`rm-\${Date.now()}\`;
    const building = this.hostel_buildings.find(b => b.id === data.building_id);
    const room: HostelRoom = {
      id,
      building_id: data.building_id || 'bld-01',
      building_name: data.building_name || (building ? building.code : 'SBS-A'),
      floor_number: data.floor_number ?? 1,
      room_number: data.room_number || '101',
      room_name: data.room_name || \`Suite \${data.room_number || '101'}\`,
      capacity: data.capacity || 2,
      current_occupancy: data.current_occupancy || 0,
      washroom_type: data.washroom_type || 'ARW',
      has_window: data.has_window ?? true,
      is_ac: data.is_ac ?? false,
      has_almirah: data.has_almirah ?? true,
      monthly_rent: data.monthly_rent || 6500,
      semester_rent: data.semester_rent || 36000,
      status: data.status || 'available',
    };
    this.hostel_rooms.unshift(room);
    this.save();
    return room;
  }

  public async deleteHostelRoom(id: string): Promise<{ success: boolean; error?: string }> {
    const room = this.hostel_rooms.find(r => r.id === id);
    if (!room) return { success: false, error: 'Room not found' };
    const resident = this.hostel_residents.find(res => res.room_id === id || res.room_number === room.room_number);
    if (room.current_occupancy > 0 || resident) {
      return {
        success: false,
        error: \`Cannot delete room \${room.room_number}: Bed occupied by resident scholar (Karanvir Sir Deletion Rule). Please shift or vacate resident first.\`,
      };
    }
    this.hostel_rooms = this.hostel_rooms.filter(r => r.id !== id);
    this.save();
    return { success: true };
  }

  public async getHostelResidents(campus?: string): Promise<HostelResident[]> {
    return this.hostel_residents;
  }

  public async allotHostelResident(data: {
    student_uid: string;
    student_name: string;
    course_name?: string;
    semester?: number;
    room_id: string;
    billing_cycle?: 'monthly' | 'semester';
    mess_enrolled?: boolean;
    guardian_contact?: string;
  }): Promise<{ success: boolean; error?: string; resident?: HostelResident }> {
    const room = this.hostel_rooms.find(r => r.id === data.room_id);
    if (!room) return { success: false, error: 'Target room not found' };
    if (room.current_occupancy >= room.capacity) {
      return { success: false, error: \`Room \${room.room_number} is already at full capacity (\${room.capacity}/\${room.capacity} beds occupied)\` };
    }
    const building = this.hostel_buildings.find(b => b.id === room.building_id);
    const id = \`res-\${Date.now()}\`;
    const bed_number = room.current_occupancy + 1;
    const resident: HostelResident = {
      id,
      student_uid: data.student_uid,
      student_name: data.student_name,
      course_name: data.course_name || 'B.Tech CSE',
      semester: data.semester || 1,
      building_id: room.building_id,
      building_name: room.building_name || (building ? building.code : 'SBS-A'),
      room_id: room.id,
      room_number: room.room_number,
      room_name: room.room_name,
      bed_number,
      allotted_date: new Date().toISOString().split('T')[0],
      billing_cycle: data.billing_cycle || 'semester',
      fee_status: 'paid',
      amount_due: 0,
      mess_enrolled: data.mess_enrolled ?? true,
      mess_status: (data.mess_enrolled ?? true) ? 'active' : 'cleared',
      mess_dues_amount: 0,
      has_transport: false,
      guardian_contact: data.guardian_contact || '+91 98765 00000',
    };

    room.current_occupancy += 1;
    if (room.current_occupancy >= room.capacity) room.status = 'occupied';

    this.hostel_residents.unshift(resident);

    // Update student master profile in this.students
    const stu = this.students.find(s => s.student_id === data.student_uid || s.id === data.student_uid || \`\${s.first_name} \${s.last_name}\`.toLowerCase() === data.student_name.toLowerCase());
    if (stu) {
      stu.is_hosteller = true;
      stu.hostel_room_no = room.room_number;
    }
    this.save();
    return { success: true, resident };
  }

  public async shiftHostelResident(residentId: string, targetRoomId: string, refundPreference: 'refund' | 'credit'): Promise<{ success: boolean; error?: string; resident?: HostelResident }> {
    const resident = this.hostel_residents.find(r => r.id === residentId);
    if (!resident) return { success: false, error: 'Resident not found' };
    const oldRoom = this.hostel_rooms.find(r => r.id === resident.room_id || r.room_number === resident.room_number);
    const newRoom = this.hostel_rooms.find(r => r.id === targetRoomId);
    if (!newRoom) return { success: false, error: 'Target destination room not found' };
    if (newRoom.current_occupancy >= newRoom.capacity) {
      return { success: false, error: \`Target room \${newRoom.room_number} is already at capacity (\${newRoom.capacity}/\${newRoom.capacity})\` };
    }

    if (oldRoom) {
      oldRoom.current_occupancy = Math.max(0, oldRoom.current_occupancy - 1);
      if (oldRoom.current_occupancy < oldRoom.capacity) oldRoom.status = 'available';
    }

    newRoom.current_occupancy += 1;
    if (newRoom.current_occupancy >= newRoom.capacity) newRoom.status = 'occupied';

    resident.room_id = newRoom.id;
    resident.room_number = newRoom.room_number;
    resident.room_name = newRoom.room_name;
    resident.building_id = newRoom.building_id;
    resident.building_name = newRoom.building_name;
    resident.bed_number = newRoom.current_occupancy;

    const stu = this.students.find(s => s.student_id === resident.student_uid || \`\${s.first_name} \${s.last_name}\`.toLowerCase() === resident.student_name.toLowerCase());
    if (stu) {
      stu.hostel_room_no = newRoom.room_number;
    }
    this.save();
    return { success: true, resident };
  }

  public async getHostelMessClearances(): Promise<MessClearanceRecord[]> {
    return this.hostel_mess_clearances;
  }

  public async issueHostelMessClearance(data: {
    student_uid: string;
    student_name: string;
    room_number: string;
    building_name: string;
    diet_count_monthly: number;
    outstanding_balance: number;
    settle_arrears_at_desk?: boolean;
    signed_by_mess_manager?: string;
    remarks?: string;
  }): Promise<MessClearanceRecord> {
    const id = \`mc-\${Date.now()}\`;
    const noc: MessClearanceRecord = {
      id,
      student_uid: data.student_uid,
      student_name: data.student_name,
      room_number: data.room_number,
      building_name: data.building_name,
      diet_count_monthly: data.diet_count_monthly,
      outstanding_balance: data.settle_arrears_at_desk ? 0 : data.outstanding_balance,
      clearance_status: data.outstanding_balance === 0 || data.settle_arrears_at_desk ? 'cleared' : 'dues_pending',
      signed_by_mess_manager: data.signed_by_mess_manager || 'S. Kulwinder Singh (Chief Steward)',
      clearance_timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      caution_deposit_refund_eligible: (data.outstanding_balance === 0 || data.settle_arrears_at_desk),
      remarks: data.remarks || 'Mess No-Dues Clearance verified. Utensils and kitchen linen returned.',
    };

    this.hostel_mess_clearances.unshift(noc);

    const resident = this.hostel_residents.find(r => r.student_uid === data.student_uid);
    if (resident) {
      resident.mess_status = noc.clearance_status;
      if (noc.clearance_status === 'cleared') resident.mess_dues_amount = 0;
    }
    this.save();
    return noc;
  }
`;

  const endMarker = 'export const db = new DatabaseStore();';
  const pos = content.lastIndexOf(endMarker);
  if (pos !== -1) {
    content = content.slice(0, pos) + storeMethods + '\n' + content.slice(pos);
  } else {
    throw new Error('Could not find DatabaseStore export marker');
  }
}

fs.writeFileSync(dbPath, content, 'utf8');
console.log('Successfully patched server/db.ts with complete Hostel data structures & methods!');
