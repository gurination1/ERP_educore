import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const hostelRouter = Router();

// 1. Get all hostel buildings (with optional campus filter)
hostelRouter.get('/buildings', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campus = req.query.campus as string | undefined;
    const buildings = await db.getHostelBuildings(campus);
    res.json({ success: true, count: buildings.length, buildings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Create new hostel building (Admin / Hostel Warden / Super Admin)
const createBuildingSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  campus_id: z.enum(['campus_01', 'campus_02', 'all']).default('campus_01'),
  campus_name: z.string().optional(),
  address: z.string().optional(),
  location_type: z.enum(['in_campus', 'off_campus']).default('in_campus'),
  ownership: z.enum(['owned', 'leased']).default('owned'),
  vendor_name: z.string().optional(),
  vendor_contact: z.string().optional(),
  total_floors: z.number().int().min(1).default(3),
  total_rooms: z.number().int().min(1).default(24),
  inspected_by: z.string().optional(),
});

hostelRouter.post('/buildings', authenticateToken, requireRole('admin', 'super_admin', 'hostel'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createBuildingSchema.parse(req.body);
    const building = await db.createHostelBuilding(validated);
    res.status(201).json({ success: true, message: 'Hostel building created successfully', building });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Get all rooms (with optional building and campus filter)
hostelRouter.get('/rooms', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buildingId = req.query.building_id as string | undefined;
    const campus = req.query.campus as string | undefined;
    const rooms = await db.getHostelRooms(buildingId, campus);
    res.json({ success: true, count: rooms.length, rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create new hostel room
const createRoomSchema = z.object({
  building_id: z.string().min(2),
  building_name: z.string().optional(),
  floor_number: z.number().int().min(0).default(1),
  room_number: z.string().min(1),
  room_name: z.string().optional(),
  capacity: z.number().int().min(1).max(8).default(2),
  washroom_type: z.enum(['ARW', 'FCW']).default('ARW'),
  has_window: z.boolean().default(true),
  is_ac: z.boolean().default(false),
  has_almirah: z.boolean().default(true),
  monthly_rent: z.number().min(0).default(6500),
  semester_rent: z.number().min(0).default(36000),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available'),
});

hostelRouter.post('/rooms', authenticateToken, requireRole('admin', 'super_admin', 'hostel'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createRoomSchema.parse(req.body);
    const room = await db.createHostelRoom(validated);
    res.status(201).json({ success: true, message: 'Hostel room created successfully', room });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Delete room (Karanvir Sir Deletion Safety Rule: cannot delete if occupied!)
hostelRouter.delete('/rooms/:id', authenticateToken, requireRole('admin', 'super_admin', 'hostel'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await db.deleteHostelRoom(req.params.id);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Get all residents (with optional campus filter)
hostelRouter.get('/residents', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campus = req.query.campus as string | undefined;
    const residents = await db.getHostelResidents(campus);
    res.json({ success: true, count: residents.length, residents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Allot scholar to room
const allotSchema = z.object({
  student_uid: z.string().min(2),
  student_name: z.string().min(2),
  course_name: z.string().optional(),
  semester: z.number().int().min(1).default(1),
  room_id: z.string().min(2),
  billing_cycle: z.enum(['monthly', 'semester']).default('semester'),
  mess_enrolled: z.boolean().default(true),
  guardian_contact: z.string().optional(),
});

hostelRouter.post('/allot', authenticateToken, requireRole('admin', 'super_admin', 'hostel'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = allotSchema.parse(req.body);
    const result = await db.allotHostelResident(validated as any);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, message: 'Scholar allotted to hostel room successfully', resident: result.resident });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Shift resident to another room
const shiftSchema = z.object({
  resident_id: z.string().min(2),
  target_room_id: z.string().min(2),
  refund_preference: z.enum(['refund', 'credit']).default('credit'),
});

hostelRouter.post('/shift', authenticateToken, requireRole('admin', 'super_admin', 'hostel'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = shiftSchema.parse(req.body);
    const result = await db.shiftHostelResident(validated.resident_id, validated.target_room_id, validated.refund_preference);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, message: 'Resident room shifted successfully', resident: result.resident });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 9. Get Mess No-Dues Clearances
hostelRouter.get('/mess-clearances', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clearances = await db.getHostelMessClearances();
    res.json({ success: true, count: clearances.length, clearances });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Issue Mess No-Dues Clearance (Digital NOC Certificate)
const issueNocSchema = z.object({
  student_uid: z.string().min(2),
  student_name: z.string().min(2),
  room_number: z.string().min(1),
  building_name: z.string().min(2),
  diet_count_monthly: z.number().min(0).default(60),
  outstanding_balance: z.number().default(0),
  settle_arrears_at_desk: z.boolean().default(false),
  signed_by_mess_manager: z.string().default('Chef Balwant Singh (Chief Steward)'),
  remarks: z.string().optional(),
});

hostelRouter.post('/mess-clearance', authenticateToken, requireRole('admin', 'super_admin', 'hostel'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = issueNocSchema.parse(req.body);
    const noc = await db.issueHostelMessClearance(validated as any);
    res.status(201).json({ success: true, message: 'Mess No-Dues Clearance NOC issued successfully', noc });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
