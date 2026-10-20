import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Bed,
  Users,
  UtensilsCrossed,
  Wrench,
  Bus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowRightLeft,
  Trash2,
  MapPin,
  Calendar,
  FileCheck,
  DollarSign,
  Phone,
  Eye,
  X,
  ExternalLink,
  Zap,
  Printer,
  LogOut,
} from 'lucide-react';
import {
  User,
  HostelBuilding,
  HostelRoom,
  HostelResident,
  MessClearanceRecord,
  TransportVehicle,
} from '../types';

interface HostelManagementViewProps {
  currentUser: User | null;
  selectedCampus?: 'campus_01' | 'campus_02' | 'all';
  onOpenMasterTables?: (tab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents' | 'hostel' | 'fees' | 'employee') => void;
  onNavigate?: (screen: string) => void;
}

export const HostelManagementView: React.FC<HostelManagementViewProps> = ({
  currentUser,
  selectedCampus,
  onOpenMasterTables,
  onNavigate,
}) => {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  const getInitialTab = (): 'overview' | 'unassigned' | 'buildings' | 'rooms' | 'residents' | 'mess' | 'maintenance' => {
    if (urlTab && ['overview', 'unassigned', 'buildings', 'rooms', 'residents', 'mess', 'maintenance'].includes(urlTab)) {
      return urlTab as any;
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    if (urlTab && ['overview', 'unassigned', 'buildings', 'rooms', 'residents', 'mess', 'maintenance'].includes(urlTab)) {
      setActiveTab(urlTab as any);
    }
  }, [urlTab]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('ALL');
  const [selectedRoomStatusFilter, setSelectedRoomStatusFilter] = useState('ALL');

  // Modals
  const [isRoomShiftModalOpen, setIsRoomShiftModalOpen] = useState(false);
  const [shiftingResident, setShiftingResident] = useState<HostelResident | null>(null);
  const [targetRoomId, setTargetRoomId] = useState('');
  const [refundPreference, setRefundPreference] = useState<'refund' | 'credit'>('credit');

  const [isMessClearanceModalOpen, setIsMessClearanceModalOpen] = useState(false);
  const [clearingResident, setClearingResident] = useState<HostelResident | null>(null);
  const [messBillingPolicy, setMessBillingPolicy] = useState<'monthly' | 'bi_monthly' | 'semester_lump_sum'>('monthly');

  // Digital Mess No-Dues Clearance Certificate Modal (Karanvir Sir Lecture 4 Segment 8)
  const [selectedNocRecord, setSelectedNocRecord] = useState<MessClearanceRecord | null>(null);
  const [isNocModalOpen, setIsNocModalOpen] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Mock Buildings Data (Karanvir Sir Lecture 4: Owned vs Leased, Vendor link, 360-day maintenance, 90-day electrical)
  const [buildings, setBuildings] = useState<HostelBuilding[]>([
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
      maintenance_due_days: 18, // Alert countdown
      electrical_check_days: 4,  // Alert countdown
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
  ]);

  // Mock Rooms Data (Karanvir Sir Lecture 4: custom names like "Guru Mahal", "Baljinder Room", AC/Non-AC, Almirah)
  const [rooms, setRooms] = useState<HostelRoom[]>([
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
  ]);

  // Mock Residents Data
  const [residents, setResidents] = useState<HostelResident[]>([
    {
      id: 'res-01',
      student_uid: '1001-01-01-03-01',
      student_name: 'Aryan Sharma',
      course_name: 'B.Tech Computer Science & Engg',
      semester: 6,
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
  ]);

  // Mock Mess Clearances
  const [messClearances, setMessClearances] = useState<MessClearanceRecord[]>([
    {
      id: 'mc-01',
      student_uid: '1001-01-01-03-01',
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
  ]);

  // Mock Transport Fleet
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([
    {
      id: 'vh-01',
      vehicle_number: 'PB 03 BA 1122',
      seater_capacity: 52,
      is_ac: true,
      ownership: 'college_owned',
      driver_name: 'Major Singh',
      driver_phone: '+91 98760 11223',
      route_name: 'Route 1: Bathinda City Bus Stand → Goniana → Campus',
      stops: ['Bus Stand', 'Civil Lines', 'Rose Garden', 'Goniana Mandi', 'Campus Gate 1'],
      total_allocated: 48,
      is_active: true,
    },
    {
      id: 'vh-02',
      vehicle_number: 'PB 03 BC 4499',
      seater_capacity: 42,
      is_ac: false,
      ownership: 'vendor_leased',
      vendor_name: 'Kisan Travels Logistics',
      driver_name: 'Gurcharan Singh',
      driver_phone: '+91 94170 33445',
      route_name: 'Route 2: Kotkapura → Jaitu → Bajakhana → Campus',
      stops: ['Kotkapura Chowk', 'Jaitu Mandi', 'Bajakhana', 'Campus Gate 2'],
      total_allocated: 42, // Full
      is_active: true,
    },
  ]);

  // Unallocated Transport Scholars
  const unallocatedTransportScholars = [
    { uid: '1001-01-99-03-01', name: 'Harpreet Kaur', course: 'B.Sc Agriculture', stopRequested: 'Goniana Mandi', appliedDate: '2026-10-15' },
    { uid: '1001-01-98-03-01', name: 'Manjot Singh', course: 'B.Tech ECE', stopRequested: 'Civil Lines', appliedDate: '2026-10-16' },
  ];

  // Unallocated Hostel Scholars Queue (Karanvir Sir Lecture 4 Segment 7)
  const [unallocatedHostelScholars, setUnallocatedHostelScholars] = useState([
    {
      uid: '1001-01-10-03-01',
      name: 'Manpreet Singh',
      course: 'BCA (Cloud & AI)',
      semester: 1,
      gender: 'male',
      preferredRoomType: 'AC 2-Sharing (ARW)',
      appliedDate: '2026-10-14',
      contact: '+91 98141 55667',
      hasTransport: false,
    },
    {
      uid: '1001-01-11-03-01',
      name: 'Simran Kaur',
      course: 'B.Tech Computer Science',
      semester: 1,
      gender: 'female',
      preferredRoomType: 'Non-AC 3-Sharing (FCW)',
      appliedDate: '2026-10-15',
      contact: '+91 98722 33445',
      hasTransport: true,
    },
    {
      uid: '1001-01-12-03-01',
      name: 'Harjot Singh Virk',
      course: 'MBA Finance',
      semester: 1,
      gender: 'male',
      preferredRoomType: 'AC 1-Sharing (ARW)',
      appliedDate: '2026-10-16',
      contact: '+91 94170 88990',
      hasTransport: false,
    },
    {
      uid: '1001-01-13-03-01',
      name: 'Gagandeep Sharma',
      course: 'B.Sc Agriculture',
      semester: 1,
      gender: 'male',
      preferredRoomType: 'Non-AC 2-Sharing (ARW)',
      appliedDate: '2026-10-17',
      contact: '+91 98888 22114',
      hasTransport: false,
    },
  ]);

  // Add Room Wizard Modal State (Karanvir Sir Lecture 4: Floor auto-numbering, ARW vs FCW, Nickname)
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomBuildingId, setNewRoomBuildingId] = useState('bld-01');
  const [newRoomFloor, setNewRoomFloor] = useState(2);
  const [newRoomNumber, setNewRoomNumber] = useState('204');
  const [newRoomName, setNewRoomName] = useState('Dr. APJ Kalam Memorial Suite');
  const [newRoomCapacity, setNewRoomCapacity] = useState(2);
  const [newRoomWashroomType, setNewRoomWashroomType] = useState<'ARW' | 'FCW'>('ARW');
  const [newRoomIsAc, setNewRoomIsAc] = useState(true);
  const [newRoomHasWindow, setNewRoomHasWindow] = useState(true);
  const [newRoomHasAlmirah, setNewRoomHasAlmirah] = useState(true);
  const [newRoomMonthlyRent, setNewRoomMonthlyRent] = useState('7500');
  const [newRoomSemesterRent, setNewRoomSemesterRent] = useState('42000');

  // Scholar Allotment Modal State
  const [isAllocatingModalOpen, setIsAllocatingModalOpen] = useState(false);
  const [allocatingScholar, setAllocatingScholar] = useState<any | null>(null);
  const [selectedRoomForScholar, setSelectedRoomForScholar] = useState('');

  // Vacate Bed Modal State
  const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);
  const [vacatingResident, setVacatingResident] = useState<HostelResident | null>(null);

  // Add Residence Block Modal State (Karanvir Sir Lecture 4)
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [newBuildingForm, setNewBuildingForm] = useState({
    name: '',
    code: '',
    campus_id: selectedCampus === 'campus_02' ? 'campus_02' : 'campus_01',
    campus_name: selectedCampus === 'campus_02' ? 'Faridkot Campus 02 (Regional)' : 'Bathinda Campus 01 (Main)',
    address: '',
    location_type: 'in_campus' as 'in_campus' | 'off_campus',
    ownership: 'owned' as 'owned' | 'leased',
    vendor_name: '',
    vendor_contact: '',
    total_floors: 3,
    total_rooms: 24,
    inspected_by: 'Er. Harminder Singh (Chief Structural Auditor)',
    google_maps_url: '',
  });

  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingForm.name.trim() || !newBuildingForm.code.trim()) {
      showToast('Please provide Building Name and Block Code.', 'error');
      return;
    }
    const newBld: HostelBuilding = {
      id: `bld-${Date.now()}`,
      campus_id: newBuildingForm.campus_id,
      campus_name: newBuildingForm.campus_name,
      name: newBuildingForm.name.trim(),
      code: newBuildingForm.code.trim().toUpperCase(),
      address: newBuildingForm.address.trim() || 'Campus Residential Enclave, Bathinda, Punjab',
      location_type: newBuildingForm.location_type,
      ownership: newBuildingForm.ownership,
      vendor_name: newBuildingForm.ownership === 'leased' ? newBuildingForm.vendor_name.trim() : undefined,
      vendor_contact: newBuildingForm.ownership === 'leased' ? newBuildingForm.vendor_contact.trim() : undefined,
      total_floors: Number(newBuildingForm.total_floors) || 1,
      total_rooms: Number(newBuildingForm.total_rooms) || 12,
      maintenance_due_days: 360,
      electrical_check_days: 90,
      last_maintenance_date: new Date().toISOString().split('T')[0],
      last_electrical_inspection: new Date().toISOString().split('T')[0],
      inspected_by: newBuildingForm.inspected_by.trim() || 'Chief Estate Officer',
      google_maps_url: newBuildingForm.google_maps_url.trim() || undefined,
      is_active: true,
    };
    setBuildings((prev) => [newBld, ...prev]);
    setIsAddBuildingModalOpen(false);
    setNewBuildingForm({
      name: '',
      code: '',
      campus_id: selectedCampus === 'campus_02' ? 'campus_02' : 'campus_01',
      campus_name: selectedCampus === 'campus_02' ? 'Faridkot Campus 02 (Regional)' : 'Bathinda Campus 01 (Main)',
      address: '',
      location_type: 'in_campus',
      ownership: 'owned',
      vendor_name: '',
      vendor_contact: '',
      total_floors: 3,
      total_rooms: 24,
      inspected_by: 'Er. Harminder Singh (Chief Structural Auditor)',
      google_maps_url: '',
    });
    showToast(`Residence Block ${newBld.code} (${newBld.name}) created and added to active inventory!`);
  };

  // Add New Room Handler (Karanvir Sir Lecture 4)
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const bld = buildings.find((b) => b.id === newRoomBuildingId) || buildings[0];
    const newRoom: HostelRoom = {
      id: `rm-${Date.now()}`,
      building_id: bld.id,
      building_name: bld.code,
      floor_number: Number(newRoomFloor),
      room_number: newRoomNumber.trim(),
      room_name: newRoomName.trim() || undefined,
      capacity: Number(newRoomCapacity),
      current_occupancy: 0,
      washroom_type: newRoomWashroomType,
      is_ac: newRoomIsAc,
      has_window: newRoomHasWindow,
      has_almirah: newRoomHasAlmirah,
      monthly_rent: Number(newRoomMonthlyRent),
      semester_rent: Number(newRoomSemesterRent),
      status: 'available',
    };
    setRooms([newRoom, ...rooms]);
    setIsAddRoomModalOpen(false);
    showToast(
      `Room ${newRoom.room_number} ("${newRoom.room_name || ''}") created in Block ${newRoom.building_name} with ${newRoom.washroom_type} washroom!`
    );
  };

  // Scholar Room Allotment Execution
  const handleExecuteScholarAllotment = () => {
    if (!allocatingScholar || !selectedRoomForScholar) return;
    const room = rooms.find((r) => r.id === selectedRoomForScholar);
    if (!room) return;
    if (room.current_occupancy >= room.capacity) {
      showToast(`Selected room ${room.room_number} is already at full capacity!`, 'error');
      return;
    }

    // Update room occupancy
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? {
              ...r,
              current_occupancy: r.current_occupancy + 1,
              status: r.current_occupancy + 1 >= r.capacity ? 'occupied' : 'available',
            }
          : r
      )
    );

    // Create resident record
    const newResident: HostelResident = {
      id: `res-${Date.now()}`,
      student_uid: allocatingScholar.uid,
      student_name: allocatingScholar.name,
      course_name: allocatingScholar.course,
      semester: allocatingScholar.semester,
      building_id: room.building_id,
      building_name: room.building_name,
      room_id: room.id,
      room_number: room.room_number,
      room_name: room.room_name,
      bed_number: room.current_occupancy + 1,
      allotted_date: new Date().toISOString().split('T')[0],
      billing_cycle: 'semester',
      fee_status: 'paid',
      amount_due: 0,
      mess_enrolled: true,
      mess_status: 'active',
      mess_dues_amount: 0,
      has_transport: allocatingScholar.hasTransport,
      guardian_contact: allocatingScholar.contact,
    };

    setResidents([newResident, ...residents]);
    setUnallocatedHostelScholars((prev) => prev.filter((s) => s.uid !== allocatingScholar.uid));
    setIsAllocatingModalOpen(false);
    setAllocatingScholar(null);
    setSelectedRoomForScholar('');

    showToast(
      `Scholar ${newResident.student_name} allotted Room ${room.room_number} (${room.room_name || ''}) in Block ${room.building_name}!`
    );
  };

  // Room Deletion Guard (Karanvir Sir Lecture 4): Cannot delete room if occupied!
  const handleDeleteRoom = (roomId: string) => {
    const target = rooms.find((r) => r.id === roomId);
    if (!target) return;
    if (target.current_occupancy > 0) {
      showToast(
        `FORBIDDEN: Room ${target.room_number} (${target.room_name || ''}) has ${target.current_occupancy} active resident(s). Reallocate scholars before deleting!`,
        'error'
      );
      return;
    }
    setRooms(rooms.filter((r) => r.id !== roomId));
    showToast(`Room ${target.room_number} deleted successfully.`);
  };

  // Room Shifting Handler
  const handleExecuteRoomShift = () => {
    if (!shiftingResident || !targetRoomId) return;
    const destRoom = rooms.find((r) => r.id === targetRoomId);
    if (!destRoom) return;
    if (destRoom.current_occupancy >= destRoom.capacity) {
      showToast(`Target Room ${destRoom.room_number} is already at full capacity!`, 'error');
      return;
    }

    const origRoom = rooms.find((r) => r.id === shiftingResident.room_id);
    const rentDiff = destRoom.semester_rent - (origRoom ? origRoom.semester_rent : 0);

    // Update rooms occupancy
    setRooms((prev) =>
      prev.map((r) => {
        if (origRoom && r.id === origRoom.id) {
          const nextOcc = Math.max(0, r.current_occupancy - 1);
          return { ...r, current_occupancy: nextOcc, status: nextOcc === 0 ? 'available' : 'available' };
        }
        if (r.id === destRoom.id) {
          const nextOcc = r.current_occupancy + 1;
          return { ...r, current_occupancy: nextOcc, status: nextOcc >= r.capacity ? 'occupied' : 'available' };
        }
        return r;
      })
    );

    // Update resident allotment
    setResidents((prev) =>
      prev.map((res) => {
        if (res.id === shiftingResident.id) {
          return {
            ...res,
            room_id: destRoom.id,
            room_number: destRoom.room_number,
            room_name: destRoom.room_name,
            building_id: destRoom.building_id,
            building_name: destRoom.building_name,
            amount_due: rentDiff > 0 ? res.amount_due + rentDiff : res.amount_due,
          };
        }
        return res;
      })
    );

    let feeMsg = '';
    if (rentDiff > 0) {
      feeMsg = ` Additional debit of ₹${(rentDiff || 0).toLocaleString()} posted to scholar fee ledger.`;
    } else if (rentDiff < 0) {
      const refundAmt = Math.abs(rentDiff);
      feeMsg =
        refundPreference === 'refund'
          ? ` Refund voucher for ₹${(refundAmt || 0).toLocaleString()} generated for accounts approval.`
          : ` ₹${(refundAmt || 0).toLocaleString()} retained as fee ledger credit balance.`;
    }

    showToast(
      `Scholar ${shiftingResident.student_name} shifted to Room ${destRoom.room_number} (${destRoom.room_name || ''}).${feeMsg}`
    );
    setIsRoomShiftModalOpen(false);
    setShiftingResident(null);
  };

  // Mess Clearance Handler
  const handleIssueMessClearance = () => {
    if (!clearingResident) return;
    if (clearingResident.mess_dues_amount > 0) {
      showToast(
        `Cannot issue clearance: Scholar has ₹${clearingResident.mess_dues_amount} outstanding mess dues!`,
        'error'
      );
      return;
    }

    const newCert: MessClearanceRecord = {
      id: `mc-${Date.now()}`,
      student_uid: clearingResident.student_uid,
      student_name: clearingResident.student_name,
      room_number: clearingResident.room_number,
      building_name: clearingResident.building_name,
      diet_count_monthly: 62,
      outstanding_balance: 0,
      clearance_status: 'cleared',
      signed_by_mess_manager: `${currentUser?.full_name || 'Chief Warden'} (Residence Authority)`,
      clearance_timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST',
      caution_deposit_refund_eligible: true,
      remarks: 'Digital clearance certified. Caution deposit release unlocked.',
    };

    setMessClearances([newCert, ...messClearances]);
    setResidents((prev) =>
      prev.map((r) => (r.id === clearingResident.id ? { ...r, mess_status: 'cleared', mess_dues_amount: 0 } : r))
    );

    showToast(`Mess No-Dues Certificate issued for ${clearingResident.student_name}! Caution deposit unlocked.`);
    setIsMessClearanceModalOpen(false);
    setClearingResident(null);
  };

  const handleSettleAndIssueMessClearance = () => {
    if (!clearingResident) return;
    const newCert: MessClearanceRecord = {
      id: `mc-${Date.now()}`,
      student_uid: clearingResident.student_uid,
      student_name: clearingResident.student_name,
      room_number: clearingResident.room_number,
      building_name: clearingResident.building_name,
      diet_count_monthly: 62,
      outstanding_balance: 0,
      clearance_status: 'cleared',
      signed_by_mess_manager: `${currentUser?.full_name || 'Chief Warden'} (Residence Authority)`,
      clearance_timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST',
      caution_deposit_refund_eligible: true,
      remarks: 'Diet arrears settled at desk. Digital clearance certified.',
    };

    setMessClearances([newCert, ...messClearances]);
    setResidents((prev) =>
      prev.map((r) => (r.id === clearingResident.id ? { ...r, mess_status: 'cleared', mess_dues_amount: 0 } : r))
    );

    showToast(`Arrears settled & Mess No-Dues Certificate issued for ${clearingResident.student_name}!`);
    setIsMessClearanceModalOpen(false);
    setClearingResident(null);
  };

  const handleExecuteVacateBed = () => {
    if (!vacatingResident) return;
    if ((Number(vacatingResident.mess_dues_amount) || 0) > 0 || (Number(vacatingResident.amount_due) || 0) > 0) {
      showToast(
        `FORBIDDEN: Resident ${vacatingResident.student_name} has pending arrears. Clear dues before vacate!`,
        'error'
      );
      return;
    }
    // Decrement room occupancy
    setRooms((prev) =>
      prev.map((r) =>
        r.id === vacatingResident.room_id
          ? {
              ...r,
              current_occupancy: Math.max(0, r.current_occupancy - 1),
              status: 'available',
            }
          : r
      )
    );
    setResidents((prev) => prev.filter((r) => r.id !== vacatingResident.id));
    showToast(`Bed vacated for ${vacatingResident.student_name}. Room ${vacatingResident.room_number} vacancy restored.`);
    setIsVacateModalOpen(false);
    setVacatingResident(null);
  };

  const handleSettleAndVacateBed = () => {
    if (!vacatingResident) return;
    // Decrement room occupancy
    setRooms((prev) =>
      prev.map((r) =>
        r.id === vacatingResident.room_id
          ? {
              ...r,
              current_occupancy: Math.max(0, r.current_occupancy - 1),
              status: 'available',
            }
          : r
      )
    );
    setResidents((prev) => prev.filter((r) => r.id !== vacatingResident.id));
    showToast(`Arrears settled and bed vacated for ${vacatingResident.student_name}. Room ${vacatingResident.room_number} is now vacant.`);
    setIsVacateModalOpen(false);
    setVacatingResident(null);
  };

  // Campus scoping
  const visibleBuildings = buildings.filter(b =>
    !selectedCampus || selectedCampus === 'all' || b.campus_id === selectedCampus || (selectedCampus === 'campus_01' && b.campus_id === 'cmp-01')
  );
  const visibleBuildingIds = new Set(visibleBuildings.map(b => b.id));
  const visibleRooms = rooms.filter(r => visibleBuildingIds.has(r.building_id));

  // Overview KPIs (Scoped to visible buildings/rooms)
  const totalBeds = visibleRooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupiedBeds = visibleRooms.reduce((acc, r) => acc + r.current_occupancy, 0);
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0';
  const totalMessDues = residents
    .filter(r => visibleBuildingIds.has(r.building_id))
    .reduce((acc, r) => acc + (Number(r.mess_dues_amount) || 0), 0);

  // Student Personal Allotment Resolution
  const studentResident = currentUser?.role === 'student'
    ? residents.find(r =>
        (currentUser.enterprise_uid && (
          r.student_uid === currentUser.enterprise_uid ||
          r.student_uid === currentUser.enterprise_uid.replace(/BFGI/g, '01') ||
          r.student_uid.replace(/[^0-9]/g, '') === currentUser.enterprise_uid.replace(/[^0-9]/g, '')
        )) ||
        (currentUser.full_name && r.student_name.toLowerCase().trim() === currentUser.full_name.toLowerCase().trim())
      )
    : null;

  const studentRoommates = studentResident
    ? residents.filter(r => r.room_id === studentResident.room_id && r.id !== studentResident.id)
    : [];

  const studentRoom = studentResident
    ? rooms.find(r => r.id === studentResident.room_id)
    : null;

  const studentBuilding = studentResident
    ? buildings.find(b => b.id === studentResident.building_id || b.code === studentResident.building_name)
    : null;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xl border animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'error'
              ? 'bg-rose-900/90 text-white border-rose-500/30'
              : 'bg-emerald-900/90 text-white border-emerald-500/30'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Student Personal Residence View vs Administrative Command Console */}
      {currentUser?.role === 'student' ? (
        studentResident ? (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-200">
                    Residence Allotment Active
                  </span>
                  <h1 className="text-xl font-black text-[#00236f] tracking-tight mt-1">
                    {studentBuilding?.name || `Residence Block ${studentResident.building_name}`}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Room {studentResident.room_number} {studentResident.room_name ? `("${studentResident.room_name}")` : ''} • Floor {studentRoom?.floor_number || 1} • {studentRoom?.is_ac ? 'AC' : 'Non-AC'} {studentRoom?.capacity || 2}-Sharing Suite ({studentRoom?.washroom_type === 'ARW' ? 'Attached Washroom' : 'Common Washroom'})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const noc = messClearances.find(m => m.student_uid === studentResident.student_uid) || messClearances[0];
                    setSelectedNocRecord(noc);
                    setIsNocModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>View Digital Mess NOC Certificate</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Assigned Bed</span>
                  <div className="text-lg font-black text-[#00236f] mt-1">Bed #{studentResident.bed_number}</div>
                  <span className="text-emerald-700 font-semibold text-[11px]">Occupancy: {studentRoom?.current_occupancy || 2}/{studentRoom?.capacity || 2} Allotted</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Assigned Roommate(s)</span>
                  <div className="text-sm font-black text-slate-900 mt-1 truncate" title={studentRoommates.map(m => m.student_name).join(', ') || 'No roommates'}>
                    {studentRoommates.map(m => m.student_name).join(', ') || 'Single Occupant / No Roommate'}
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                    {studentRoommates[0] ? `${studentRoommates[0].course_name} • Sem ${studentRoommates[0].semester}` : 'Independent Room'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Semester Rent Structure</span>
                  <div className="text-lg font-black text-emerald-700 mt-1">₹{(studentRoom?.semester_rent || 42000).toLocaleString('en-IN')} / Sem</div>
                  <span className="text-emerald-700 font-semibold text-[11px]">Status: {studentResident.fee_status === 'paid' ? 'Cleared & Paid' : 'Fee Due'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Mess Clearance</span>
                  <div className="text-lg font-black text-emerald-700 mt-1">
                    {studentResident.mess_dues_amount === 0 ? 'No-Dues Certified' : `₹${studentResident.mess_dues_amount} Due`}
                  </div>
                  <span className="text-slate-500 text-[11px]">Caution Deposit: Refund Eligible</span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#00236f]">Chief Warden Desk & Emergency Assistance</div>
                  <div className="text-slate-600">Dr. Gurdial Singh (Warden Office, Block A Ground Floor) • Hotline: +91 98140 12345</div>
                </div>
                <span className="px-3 py-1 bg-white rounded-full font-mono text-[11px] font-bold text-[#00236f] border border-blue-200 shadow-2xs self-start sm:self-auto">
                  Night Gate Curfew: 10:00 PM
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] text-center max-w-2xl mx-auto space-y-4 my-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
              <Building2 className="w-7 h-7 text-[#00236f]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs uppercase border border-slate-200">
              Day Scholar • Non-Resident Record
            </div>
            <h2 className="text-xl font-black text-[#00236f]">
              No Active Hostel Accommodation Assigned
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
              Your profile is registered as a <span className="font-semibold text-slate-900">Day Scholar</span> at {selectedCampus === 'campus_02' ? 'Faridkot Campus 02' : 'Bathinda Main Campus'}. You currently do not have a reserved bed or residence room allotment on file.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  showToast('Hostel boarding request dispatched to Chief Warden office. Application reference: REQ-HST-' + Date.now().toString().slice(-6));
                }}
                className="px-5 py-2.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
              >
                <Bed className="w-4 h-4 text-amber-300" />
                <span>Submit Hostel Accommodation Request</span>
              </button>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 max-w-md mx-auto">
              <span className="font-bold">Chief Warden Helpdesk:</span> Warden Office Ground Floor • Phone: +91 98140 12345 • Night Curfew 10:00 PM
            </div>
          </div>
        )
      ) : (
        <>
          {/* Header Context Banner */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] font-black text-[10px] uppercase tracking-wider">
                  Role: Campus Residences & Hostel Administration
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-semibold">
                  Accessible by Chief Warden & Institutional Admin
                </span>
              </div>
              <h1 className="text-xl font-black text-[#00236f] tracking-tight">
                Hostel Operations, Residence & Logistics Command
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time Room Allocation • Mess No-Dues Clearance • Building 360-Day Maintenance Timers
              </p>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2">
              {onOpenMasterTables && (
                <button
                  type="button"
                  onClick={() => onOpenMasterTables('hostel')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Master Residence Data</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (unallocatedHostelScholars.length > 0) {
                    setAllocatingScholar(unallocatedHostelScholars[0]);
                    setSelectedRoomForScholar('');
                    setIsAllocatingModalOpen(true);
                  } else {
                    setActiveTab('unassigned');
                    showToast('All scholar applications currently have beds allocated.');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Allot Bed / Room</span>
              </button>
            </div>
          </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold text-slate-600">
        {[
          { id: 'overview', label: 'Operations Overview', icon: Building2 },
          { id: 'unassigned', label: `Unallocated Scholars (${unallocatedHostelScholars.length})`, icon: Users },
          { id: 'buildings', label: `Buildings & Blocks (${visibleBuildings.length})`, icon: Building2 },
          { id: 'rooms', label: 'Room Inventory & Typology', icon: Bed },
          { id: 'residents', label: 'Resident Scholars', icon: Users },
          { id: 'mess', label: 'Mess & No-Dues Clearance', icon: UtensilsCrossed },
          { id: 'maintenance', label: 'Maintenance & Safety Timers', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-hostel-tab={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPERATIONS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Bed Capacity</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#00236f]">{totalBeds}</span>
                <span className="text-xs font-semibold text-slate-500">beds across 3 blocks</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{totalBeds - occupiedBeds} beds currently vacant</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Occupancy Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#ea580c]">{occupancyRate}%</span>
                <span className="text-xs font-semibold text-slate-500">{occupiedBeds} occupied</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 font-semibold">
                85% Target Occupancy Met
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Mess Scholars</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-700">
                  {residents.filter((r) => r.mess_enrolled).length}
                </span>
                <span className="text-xs font-semibold text-slate-500">diners</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>₹{(totalMessDues || 0).toLocaleString()} pending dues</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Maintenance & Safety</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-600">2 Alerts</span>
                <span className="text-xs font-semibold text-slate-500">inspection due</span>
              </div>
              <div className="mt-2 text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Block B overhaul & electrical</span>
              </div>
            </div>
          </div>

          {/* Buildings Overview Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
            <h2 className="text-sm font-black text-[#00236f] mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#ea580c]" />
              <span>Residence Blocks Status & Ownership Registry</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Block / Residence</th>
                    <th className="py-2.5 px-3">Campus</th>
                    <th className="py-2.5 px-3">Ownership Model</th>
                    <th className="py-2.5 px-3">Capacity</th>
                    <th className="py-2.5 px-3">Annual Overhaul (360d)</th>
                    <th className="py-2.5 px-3">Electrical Check (90d)</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {visibleBuildings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#00236f]">{b.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Code: {b.code} • {b.total_floors} Floors</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{b.campus_name}</td>
                      <td className="py-3 px-3">
                        {b.ownership === 'owned' ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                            College Owned
                          </span>
                        ) : (
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                              Leased from Vendor
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{b.vendor_name}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {b.total_rooms} Rooms
                      </td>
                      <td className="py-3 px-3">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.maintenance_due_days <= 30
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Due in {b.maintenance_due_days} days</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.electrical_check_days <= 14
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>Due in {b.electrical_check_days} days</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {b.google_maps_url && (
                          <a
                            href={b.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all"
                          >
                            <MapPin className="w-3 h-3 text-[#ea580c]" />
                            <span>Location</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: UNALLOCATED SCHOLARS QUEUE */}
      {activeTab === 'unassigned' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[#00236f] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#ea580c]" />
                <span>Unallocated Scholars Queue ({unallocatedHostelScholars.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students who have requested collegiate residence awaiting room & bed assignment.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {rooms.reduce((acc, r) => acc + (r.capacity - r.current_occupancy), 0)} Vacant Beds Available
              </span>
            </div>
          </div>

          {unallocatedHostelScholars.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              All scholar residence applications have been allocated rooms.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Scholar & UID</th>
                    <th className="py-2.5 px-3">Course / Sem</th>
                    <th className="py-2.5 px-3">Gender</th>
                    <th className="py-2.5 px-3">Preferred Typology</th>
                    <th className="py-2.5 px-3">Application Date</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {unallocatedHostelScholars.map((scholar) => (
                    <tr key={scholar.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#00236f]">{scholar.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{scholar.uid}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-semibold">{scholar.course}</div>
                        <div className="text-[11px] text-slate-500">Semester {scholar.semester}</div>
                      </td>
                      <td className="py-3 px-3 capitalize font-semibold text-slate-700">
                        {scholar.gender}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                          {scholar.preferredRoomType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {scholar.appliedDate}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {scholar.contact}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setAllocatingScholar(scholar);
                            setSelectedRoomForScholar('');
                            setIsAllocatingModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#00236f] hover:bg-[#001744] text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Bed className="w-3.5 h-3.5 text-amber-300" />
                          <span>Allot Bed</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUILDINGS & BLOCKS */}
      {activeTab === 'buildings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-[#00236f] text-sm">Residence Blocks & Structural Inventory</h3>
              <p className="text-slate-500 text-[11px]">
                {visibleBuildings.length} residence blocks registered • 360-Day structural overhaul & 90-day electrical audit timers
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onOpenMasterTables && (
                <button
                  type="button"
                  onClick={() => onOpenMasterTables('hostel')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Master Residence Settings</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddBuildingModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Add Residence Block</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleBuildings.map((b) => (
            <div key={b.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#00236f] font-mono font-bold text-[10px]">
                    {b.code}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        b.location_type === 'in_campus'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {b.location_type === 'in_campus' ? 'In-Campus (Main Gate)' : 'Off-Campus (Outside Boundary)'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        b.ownership === 'owned'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {b.ownership === 'owned' ? 'College Owned' : 'Leased Facility'}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-black text-[#00236f] leading-snug">{b.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </p>

                {b.vendor_name && (
                  <div className="mt-3 p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900">
                    <span className="font-bold block">Leasing Partner:</span>
                    <span>{b.vendor_name}</span>
                    <span className="block text-[10px] text-purple-700 mt-0.5 font-mono">{b.vendor_contact}</span>
                  </div>
                )}

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Total Floors & Rooms:</span>
                    <span className="font-bold text-slate-800">{b.total_floors} Floors • {b.total_rooms} Rooms</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Annual Structural Audit:</span>
                    <span className={`font-bold ${b.maintenance_due_days <= 30 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {b.maintenance_due_days} days remaining
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Quarterly Electrical Check:</span>
                    <span className={`font-bold ${b.electrical_check_days <= 14 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {b.electrical_check_days} days remaining
                    </span>
                  </div>
                  <div className="py-1 text-[11px] text-slate-500">
                    <span className="font-bold">Auditor:</span> {b.inspected_by}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {b.google_maps_url && (
                  <a
                    href={b.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ea580c] hover:underline"
                  >
                    <span>View Coordinates</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuildingFilter(b.code);
                    setActiveTab('rooms');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Manage Rooms
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* TAB 3: ROOM INVENTORY & BEDS */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search room # or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00236f] w-48"
                />
              </div>

              <select
                value={selectedBuildingFilter}
                onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00236f] bg-white font-semibold text-slate-700"
              >
                <option value="ALL">All Residence Blocks</option>
                {visibleBuildings.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.code} ({b.name})
                  </option>
                ))}
              </select>

              <select
                value={selectedRoomStatusFilter}
                onChange={(e) => setSelectedRoomStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00236f] bg-white font-semibold text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="available">Available Beds</option>
                <option value="occupied">Fully Occupied</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
                Showing {visibleRooms.length} rooms
              </span>
              {onOpenMasterTables && (
                <button
                  type="button"
                  onClick={() => onOpenMasterTables('hostel')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Bed className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Master Typologies</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddRoomModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Room (Auto-Numbered)</span>
              </button>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleRooms
              .filter((r) => {
                if (selectedBuildingFilter !== 'ALL' && r.building_name !== selectedBuildingFilter) return false;
                if (selectedRoomStatusFilter !== 'ALL' && r.status !== selectedRoomStatusFilter) return false;
                if (searchTerm) {
                  const s = searchTerm.toLowerCase();
                  return r.room_number.toLowerCase().includes(s) || (r.room_name && r.room_name.toLowerCase().includes(s));
                }
                return true;
              })
              .map((room) => {
                const isFull = room.current_occupancy >= room.capacity;
                return (
                  <div
                    key={room.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-black text-sm text-[#00236f]">
                          Room {room.room_number}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {room.is_ac && (
                            <span className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 font-black text-[9px] border border-sky-200">
                              AC
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isFull
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {room.current_occupancy} / {room.capacity} Beds
                          </span>
                        </div>
                      </div>

                      {room.room_name && (
                        <div className="text-xs font-bold text-slate-800 mb-1">
                          "{room.room_name}"
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 space-y-1 mt-2">
                        <div>
                          <span className="font-semibold text-slate-700">Block:</span> {room.building_name} • Floor {room.floor_number}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className={`px-2 py-0.5 rounded-md font-black text-[9px] border ${
                            room.washroom_type === 'ARW'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}>
                            {room.washroom_type === 'ARW' ? 'ARW (Attached Washroom)' : 'FCW (Floor Common Washroom)'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] border ${
                            room.has_window
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {room.has_window ? 'Window: Yes' : 'Interior (No Window)'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[9px] border border-slate-200">
                            {room.has_almirah ? 'Dedicated Almirah' : 'Shared Closet'}
                          </span>
                        </div>
                        <div className="pt-1">
                          <span className="font-semibold text-slate-700">Rent Structure:</span> ₹{(room.monthly_rent || 0).toLocaleString()}/mo • ₹{(room.semester_rent || 0).toLocaleString()}/sem
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {room.status === 'occupied' ? 'Occupancy Full' : `${room.capacity - room.current_occupancy} Bed(s) Free`}
                      </span>

                      {/* Action buttons: Allot Bed if space exists, Delete if empty */}
                      <div className="flex items-center gap-1.5">
                        {room.current_occupancy < room.capacity && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoomForScholar(room.id);
                              if (unallocatedHostelScholars.length > 0) {
                                setAllocatingScholar(unallocatedHostelScholars[0]);
                              }
                              setIsAllocatingModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-blue-50 hover:bg-blue-100 text-[#00236f] border border-blue-200"
                          >
                            <Bed className="w-3.5 h-3.5 text-blue-700" />
                            <span>Allot Bed</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.id)}
                          disabled={room.current_occupancy > 0}
                          title={
                            room.current_occupancy > 0
                              ? 'Cannot delete room with active residents'
                              : 'Delete empty room'
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            room.current_occupancy > 0
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                              : 'cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-700'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: RESIDENT SCHOLARS REGISTRY */}
      {activeTab === 'residents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black text-[#00236f] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ea580c]" />
              <span>Enrolled Hostellers & Room Allocation Registry</span>
            </h2>

            <div className="text-xs text-slate-500 font-semibold">
              {residents.length} Scholars In Residence
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2.5 px-3">Scholar & 13-Digit UID</th>
                  <th className="py-2.5 px-3">Course / Sem</th>
                  <th className="py-2.5 px-3">Room / Bed</th>
                  <th className="py-2.5 px-3">Billing Cycle</th>
                  <th className="py-2.5 px-3">Hostel Fee Status</th>
                  <th className="py-2.5 px-3">Mess & Diet Status</th>
                  <th className="py-2.5 px-3">Transport</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {residents.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#00236f]">{res.student_name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{res.student_uid}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-semibold">{res.course_name}</div>
                      <div className="text-[11px] text-slate-500">Sem {res.semester}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#ea580c]">
                        Room {res.room_number} (Bed {res.bed_number})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {res.building_name} {res.room_name ? `• ${res.room_name}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 capitalize font-semibold text-slate-700">
                      {res.billing_cycle}
                    </td>
                    <td className="py-3 px-3">
                      {res.fee_status === 'paid' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Clear (Paid)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                          ₹{res.amount_due} Due
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {res.mess_status === 'cleared' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>No-Dues Cleared</span>
                        </span>
                      ) : res.mess_status === 'dues_pending' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          <span>₹{(res.mess_dues_amount || 0).toLocaleString()} Mess Arrears</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                          Active Diner
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {res.has_transport ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          Yes (Opted)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShiftingResident(res);
                            setIsRoomShiftModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#00236f] text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Shift Room</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setClearingResident(res);
                            setIsMessClearanceModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#ea580c] text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>No-Dues</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setVacatingResident(res);
                            setIsVacateModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Vacate</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MESS OPERATIONS & NO-DUES CLEARANCE */}
      {activeTab === 'mess' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-black text-[#00236f] flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-[#ea580c]" />
                  <span>Mess Governance & Mandatory Digital No-Dues Clearance</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Karanvir Sir Lecture 4 Ordinance: Student cannot obtain Caution Deposit refund or semester exit without certified Mess Clearance.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Mess Policy Mode:</span>
                <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMessBillingPolicy('monthly');
                      showToast('Mess Billing set to Monthly Diet Audit Mode.');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      messBillingPolicy === 'monthly'
                        ? 'bg-[#00236f] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly Diet Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessBillingPolicy('bi_monthly');
                      showToast('Mess Billing set to Bi-Monthly (Every 2 Months / Saath-Saath Cycle).');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      messBillingPolicy === 'bi_monthly'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bi-Monthly (Every 2 Months)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessBillingPolicy('semester_lump_sum');
                      showToast('Mess Billing set to Semester Lump-Sum (Non-Refundable).');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      messBillingPolicy === 'semester_lump_sum'
                        ? 'bg-[#ea580c] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semester Lump-Sum (Fixed)
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Certificate ID</th>
                    <th className="py-2.5 px-3">Scholar Name & UID</th>
                    <th className="py-2.5 px-3">Room / Block</th>
                    <th className="py-2.5 px-3">Monthly Diet Count</th>
                    <th className="py-2.5 px-3">Clearance Authority</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Deposit Refund</th>
                    <th className="py-2.5 px-3 text-right">Digital NOC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {messClearances.map((mc) => (
                    <tr key={mc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{mc.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#00236f]">{mc.student_name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{mc.student_uid}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">
                        Room {mc.room_number} ({mc.building_name})
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{mc.diet_count_monthly} Diets</td>
                      <td className="py-3 px-3 text-emerald-800 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{mc.signed_by_mess_manager}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{mc.clearance_timestamp}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Unlocked (Eligible)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNocRecord(mc);
                            setIsNocModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#00236f] hover:bg-[#001744] text-white font-bold text-[10px] cursor-pointer inline-flex items-center gap-1 shadow-2xs transition-all"
                        >
                          <Printer className="w-3 h-3 text-amber-300" />
                          <span>View Certificate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MAINTENANCE & SAFETY TIMERS */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <h2 className="text-base font-black text-[#00236f] flex items-center gap-2 mb-2">
              <Wrench className="w-5 h-5 text-[#ea580c]" />
              <span>Campus Safety, Overhaul & Electrical Timers</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Automated 360-day Annual Maintenance Countdowns & 90-day Electrical Safety Audits.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {buildings.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#00236f] text-sm">{b.name}</span>
                    <span className="font-mono text-xs text-slate-500">{b.code}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-semibold">Annual Overhaul (360d):</span>
                        <span className={`font-black ${b.maintenance_due_days <= 30 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {b.maintenance_due_days} Days Left
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Last Completed: {b.last_maintenance_date}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-semibold">Electrical Audit (90d):</span>
                        <span className={`font-black ${b.electrical_check_days <= 14 ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {b.electrical_check_days} Days Left
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Last Inspection: {b.last_electrical_inspection}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(`Inspection checklist triggered for ${b.code}. Audit logged.`)}
                    className="w-full py-1.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Log Completed Safety Inspection
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )}

      {/* MODAL 1: ROOM SHIFTING WIZARD */}
      {isRoomShiftModalOpen && shiftingResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#ea580c]" />
                <span>Room Shifting & Rent Adjustment Wizard</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRoomShiftModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>
                <span className="font-bold text-slate-700">Scholar:</span> {shiftingResident.student_name} ({shiftingResident.student_uid})
              </div>
              <div>
                <span className="font-bold text-slate-700">Current Allotment:</span> Room {shiftingResident.room_number} ({shiftingResident.building_name})
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Select Target Destination Room:</label>
              <select
                value={targetRoomId}
                onChange={(e) => setTargetRoomId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
              >
                <option value="">-- Choose Vacant Room --</option>
                {rooms
                  .filter((r) => r.id !== shiftingResident.room_id && r.current_occupancy < r.capacity)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.building_name} • {r.room_name || `${r.capacity}-Seater`} • ₹{r.semester_rent}/sem)
                    </option>
                  ))}
              </select>
            </div>

            {/* Refund Preference (Karanvir Sir Lecture 4): If target room is cheaper, refund or credit? */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">If New Room Has Lower Fee Structure:</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRefundPreference('credit')}
                  className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                    refundPreference === 'credit'
                      ? 'bg-[#00236f] text-white border-[#00236f]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Ledger Credit Balance
                </button>
                <button
                  type="button"
                  onClick={() => setRefundPreference('refund')}
                  className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                    refundPreference === 'refund'
                      ? 'bg-[#ea580c] text-white border-[#ea580c]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Issue Refund Voucher
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRoomShiftModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRoomShift}
                disabled={!targetRoomId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00236f] hover:bg-[#001744] text-white shadow-sm cursor-pointer disabled:opacity-40"
              >
                Confirm Shift & Adjust Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MESS NO-DUES CLEARANCE ISSUANCE */}
      {isMessClearanceModalOpen && clearingResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Issue Mess No-Dues Clearance</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsMessClearanceModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div>
                <span className="font-bold text-slate-700">Scholar:</span> {clearingResident.student_name}
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                UID: {clearingResident.student_uid} • Room {clearingResident.room_number} ({clearingResident.building_name})
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">Outstanding Mess Arrears:</span>
                <span
                  className={`font-black text-sm ${
                    (clearingResident?.mess_dues_amount || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  ₹{(clearingResident?.mess_dues_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {clearingResident.mess_dues_amount > 0 ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Clearance Blocked: Scholar must settle all diet charges with accounts cashier before digital signature can be applied.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Zero diet arrears verified. Signing clearance will unlock the scholar's Caution Deposit Refund.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMessClearanceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              {clearingResident.mess_dues_amount > 0 ? (
                <button
                  type="button"
                  onClick={handleSettleAndIssueMessClearance}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm cursor-pointer"
                >
                  Settle Arrears & Sign Clearance
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleIssueMessClearance}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm cursor-pointer"
                >
                  Sign & Issue Digital Clearance
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL 3: ADD ROOM WIZARD (Karanvir Sir Lecture 4) */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <Bed className="w-5 h-5 text-[#ea580c]" />
                <span>Add Room (Floor-Wise Auto-Numbering)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRoomModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Residence Block:</label>
                  <select
                    value={newRoomBuildingId}
                    onChange={(e) => {
                      setNewRoomBuildingId(e.target.value);
                      const b = buildings.find((x) => x.id === e.target.value);
                      if (b) setNewRoomNumber(`${newRoomFloor}0${rooms.filter((r) => r.building_id === b.id && r.floor_number === newRoomFloor).length + 1}`);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:outline-none"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Floor Number:</label>
                  <select
                    value={newRoomFloor}
                    onChange={(e) => {
                      const fl = Number(e.target.value);
                      setNewRoomFloor(fl);
                      setNewRoomNumber(`${fl}0${rooms.filter((r) => r.building_id === newRoomBuildingId && r.floor_number === fl).length + 1}`);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((fl) => (
                      <option key={fl} value={fl}>
                        Floor {fl} ({fl === 1 ? 'Ground/First' : fl === 2 ? 'Second Floor' : `Floor ${fl}`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Room Number (Auto-Suggested):</label>
                  <input
                    type="text"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-black text-slate-900 bg-slate-50 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Custom Room Nickname:</label>
                  <input
                    type="text"
                    placeholder="e.g. Guru Mahal, Shaheed Bhagat Singh Wing, Dr. Kalam Suite"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Typology and Washroom (Karanvir Sir Lecture 4 exact words: ARW vs FCW) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Capacity (Beds):</label>
                  <select
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value={1}>1-Seater (Single Suite)</option>
                    <option value={2}>2-Seater (Double Sharing)</option>
                    <option value={3}>3-Seater (Triple Sharing)</option>
                    <option value={4}>4-Seater (Dorm Layout)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Washroom Typology:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewRoomWashroomType('ARW')}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] border cursor-pointer ${
                        newRoomWashroomType === 'ARW'
                          ? 'bg-[#00236f] text-white border-[#00236f]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      ARW (Attached)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRoomWashroomType('FCW')}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] border cursor-pointer ${
                        newRoomWashroomType === 'FCW'
                          ? 'bg-[#00236f] text-white border-[#00236f]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      FCW (Common)
                    </button>
                  </div>
                </div>
              </div>

              {/* Amenities Toggles */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 font-bold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoomIsAc}
                    onChange={(e) => setNewRoomIsAc(e.target.checked)}
                    className="rounded"
                  />
                  <span>AC Climate Control</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoomHasWindow}
                    onChange={(e) => setNewRoomHasWindow(e.target.checked)}
                    className="rounded"
                  />
                  <span>External Window</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoomHasAlmirah}
                    onChange={(e) => setNewRoomHasAlmirah(e.target.checked)}
                    className="rounded"
                  />
                  <span>Dedicated Almirah</span>
                </label>
              </div>

              {/* Rents */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Rent (₹):</label>
                  <input
                    type="number"
                    value={newRoomMonthlyRent}
                    onChange={(e) => setNewRoomMonthlyRent(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Semester Rent (₹):</label>
                  <input
                    type="number"
                    value={newRoomSemesterRent}
                    onChange={(e) => setNewRoomSemesterRent(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#00236f] text-white hover:bg-[#001744] shadow-sm cursor-pointer"
                >
                  Create Room & Register Beds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3B: ADD RESIDENCE BLOCK (Karanvir Sir Lecture 4) */}
      {isAddBuildingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#ea580c]" />
                  <span>Register New Residence Block</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Structural 360-day maintenance and 90-day electrical audit timers start upon creation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBuildingModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBuilding} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Residence Block Name:</label>
                  <input
                    type="text"
                    value={newBuildingForm.name}
                    onChange={(e) => setNewBuildingForm({ ...newBuildingForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                    placeholder="e.g. Shaheed Udham Singh Enclave"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Block Code:</label>
                  <input
                    type="text"
                    value={newBuildingForm.code}
                    onChange={(e) => setNewBuildingForm({ ...newBuildingForm, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold font-mono text-slate-800 uppercase focus:outline-none"
                    placeholder="e.g. SUS-D"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Campus Allocation:</label>
                  <select
                    value={newBuildingForm.campus_id}
                    onChange={(e) => {
                      const cid = e.target.value as 'campus_01' | 'campus_02';
                      setNewBuildingForm({
                        ...newBuildingForm,
                        campus_id: cid,
                        campus_name: cid === 'campus_02' ? 'Faridkot Campus 02 (Regional)' : 'Bathinda Campus 01 (Main)',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="campus_01">Bathinda Campus 01 (Main)</option>
                    <option value="campus_02">Faridkot Campus 02 (Regional)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location Typology:</label>
                  <select
                    value={newBuildingForm.location_type}
                    onChange={(e) => setNewBuildingForm({ ...newBuildingForm, location_type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="in_campus">In-Campus (Within Boundary)</option>
                    <option value="off_campus">Off-Campus (External Enclave)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ownership Model:</label>
                  <select
                    value={newBuildingForm.ownership}
                    onChange={(e) => setNewBuildingForm({ ...newBuildingForm, ownership: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="owned">College Owned (Self Capital)</option>
                    <option value="leased">Vendor Leased Facility</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Floors:</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={newBuildingForm.total_floors}
                      onChange={(e) => setNewBuildingForm({ ...newBuildingForm, total_floors: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Rooms:</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={newBuildingForm.total_rooms}
                      onChange={(e) => setNewBuildingForm({ ...newBuildingForm, total_rooms: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {newBuildingForm.ownership === 'leased' && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="font-bold text-purple-900 text-[11px]">Leasing Partner Details:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Vendor Company Name"
                      value={newBuildingForm.vendor_name}
                      onChange={(e) => setNewBuildingForm({ ...newBuildingForm, vendor_name: e.target.value })}
                      className="p-2 rounded-xl border border-purple-200 bg-white text-xs text-slate-800 focus:outline-none"
                      required={newBuildingForm.ownership === 'leased'}
                    />
                    <input
                      type="text"
                      placeholder="Contact / Phone"
                      value={newBuildingForm.vendor_contact}
                      onChange={(e) => setNewBuildingForm({ ...newBuildingForm, vendor_contact: e.target.value })}
                      className="p-2 rounded-xl border border-purple-200 bg-white text-xs text-slate-800 focus:outline-none"
                      required={newBuildingForm.ownership === 'leased'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address & Location:</label>
                <input
                  type="text"
                  value={newBuildingForm.address}
                  onChange={(e) => setNewBuildingForm({ ...newBuildingForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                  placeholder="e.g. Sector 4, North Enclave, Campus Perimeter Road"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Safety & Structural Auditor:</label>
                  <input
                    type="text"
                    value={newBuildingForm.inspected_by}
                    onChange={(e) => setNewBuildingForm({ ...newBuildingForm, inspected_by: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Google Maps URL (Optional):</label>
                  <input
                    type="url"
                    value={newBuildingForm.google_maps_url}
                    onChange={(e) => setNewBuildingForm({ ...newBuildingForm, google_maps_url: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                    placeholder="https://maps.google.com/?q=..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBuildingModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#00236f] text-white hover:bg-[#001744] shadow-sm cursor-pointer"
                >
                  Deploy Residence Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ALLOT ROOM TO UNALLOCATED SCHOLAR */}
      {isAllocatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <Bed className="w-5 h-5 text-[#ea580c]" />
                <span>Allot Residence Room & Bed</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAllocatingModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scholar Selection */}
            {allocatingScholar ? (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-black text-[#00236f] text-sm">{allocatingScholar.name}</div>
                  {unallocatedHostelScholars.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAllocatingScholar(null)}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      Change Scholar
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  UID: {allocatingScholar.uid} • {allocatingScholar.course} (Sem {allocatingScholar.semester})
                </div>
                <div className="text-[11px] text-[#ea580c] font-bold">
                  Requested Typology: {allocatingScholar.preferredRoomType}
                </div>
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Pending Scholar Application:</label>
                <select
                  value=""
                  onChange={(e) => {
                    const sch = unallocatedHostelScholars.find(s => s.uid === e.target.value);
                    if (sch) setAllocatingScholar(sch);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="">-- Choose Pending Scholar ({unallocatedHostelScholars.length}) --</option>
                  {unallocatedHostelScholars.map((s) => (
                    <option key={s.uid} value={s.uid}>
                      {s.name} ({s.uid} • {s.course} • {s.preferredRoomType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Available Vacant Room:</label>
              <select
                value={selectedRoomForScholar}
                onChange={(e) => setSelectedRoomForScholar(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:outline-none"
              >
                <option value="">-- Choose Matching Vacant Room --</option>
                {rooms
                  .filter((r) => r.current_occupancy < r.capacity)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.building_name} • {r.room_name || `${r.capacity}-Seater`} • {r.washroom_type} • {r.capacity - r.current_occupancy} Bed(s) Free • ₹{(r.semester_rent || 0).toLocaleString()}/sem)
                    </option>
                  ))}
              </select>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed font-semibold">
              Note: Allotting this room will automatically update live residence occupancy, mark mess registration, and synchronize statutory ledger dues.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAllocatingModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!allocatingScholar || !selectedRoomForScholar}
                onClick={handleExecuteScholarAllotment}
                className="px-5 py-2 rounded-xl font-bold bg-[#00236f] text-white hover:bg-[#001744] shadow-sm disabled:opacity-40"
              >
                Confirm Allotment & Generate Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VACATE RESIDENCE BED */}
      {isVacateModalOpen && vacatingResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-600" />
                <span>Vacate Residence Bed & Release Room</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVacateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="font-black text-[#00236f] text-sm">{vacatingResident.student_name}</div>
              <div className="text-[11px] text-slate-600 font-mono">
                UID: {vacatingResident.student_uid} • Room {vacatingResident.room_number} ({vacatingResident.building_name})
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Hostel Dues:</span>
                <span className={`font-black ${(vacatingResident.amount_due || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  ₹{(vacatingResident.amount_due || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Mess Arrears:</span>
                <span className={`font-black ${(vacatingResident.mess_dues_amount || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  ₹{(vacatingResident.mess_dues_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {(vacatingResident.mess_dues_amount || 0) > 0 || (vacatingResident.amount_due || 0) > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-900 leading-relaxed font-semibold">
                Outstanding arrears detected. Settle arrears at the warden desk or clear ledger dues before completing checkout.
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 leading-relaxed font-semibold">
                Zero arrears verified. Confirming checkout will decrement room occupancy and restore 1 bed to the vacancy pool.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsVacateModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              {(vacatingResident.mess_dues_amount || 0) > 0 || (vacatingResident.amount_due || 0) > 0 ? (
                <button
                  type="button"
                  onClick={handleSettleAndVacateBed}
                  className="px-4 py-2 rounded-xl font-bold bg-[#ea580c] text-white hover:bg-[#c2410c] shadow-sm"
                >
                  Settle Arrears & Complete Vacate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteVacateBed}
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                >
                  Confirm Vacate & Release Bed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: OFFICIAL PRINTABLE MESS NO-DUES CLEARANCE NOC CERTIFICATE */}
      {isNocModalOpen && selectedNocRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 text-slate-900 space-y-5">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                Official Digital Certificate • Karanvir Sir Seg 008 Ordinance
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Print / PDF Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNocModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Certificate Body Container */}
            <div className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-4 font-sans text-xs">
              {/* Institutional Crest & Header */}
              <div className="text-center pb-3 border-b-2 border-slate-200">
                <div className="text-[10px] font-black text-[#ea580c] uppercase tracking-widest">
                  EduCore Campus Residence & Hostels Directorate
                </div>
                <h2 className="text-lg font-black text-[#00236f] uppercase tracking-tight mt-0.5">
                  Directorate of Residence, Hostel & Mess Affairs
                </h2>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Statutory No-Dues & Security Caution Deposit Release Certificate
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-mono text-[10px] font-bold">
                  REF NO: NOC/EDU/HST/2026/{selectedNocRecord.id.toUpperCase()}
                </div>
              </div>

              {/* Scholar Information Table */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Scholar Full Name</span>
                  <span className="font-extrabold text-sm text-[#00236f]">{selectedNocRecord.student_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Permanent 13-Digit UID</span>
                  <span className="font-mono font-bold text-xs text-slate-800">{selectedNocRecord.student_uid}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Residence Allocation</span>
                  <span className="font-semibold text-slate-800">
                    Room {selectedNocRecord.room_number} ({selectedNocRecord.building_name})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Audited Diet Count</span>
                  <span className="font-semibold text-slate-800">{selectedNocRecord.diet_count_monthly} Diets Consumed</span>
                </div>
              </div>

              {/* 4-Tier Checklist Verification */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  Mandatory Statutory Audit Checkpoints (Per Karanvir Sir Mandate)
                </span>
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block text-[11px]">
                          1. Mess Diet Charges & Consumption Balance
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Verification: ₹0 Outstanding (Khaya-piya diye rakhe hain paise)
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      CLEARED ✓
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block text-[11px]">
                          2. Dining Linen, Crockery & Utensil Audit
                        </span>
                        <span className="text-[10px] text-slate-500">
                          All tableware, trays, and linen returned to Mess Steward
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      SURRENDERED ✓
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block text-[11px]">
                          3. Room Key & Residence Furniture Audit
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Keys returned, zero structural/inventory damage recorded
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      VERIFIED ✓
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 block text-[11px]">
                          4. Hostel Caution Deposit Release
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          Institutional deposit unlocked for Bursar direct transfer
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-bold text-[10px]">
                      UNLOCKED (₹5,000)
                    </span>
                  </div>
                </div>
              </div>

              {/* Authority Signoff Footer */}
              <div className="pt-3 border-t-2 border-slate-200 flex items-end justify-between text-[10px]">
                <div>
                  <span className="text-slate-400 block font-semibold">Certified By:</span>
                  <strong className="text-slate-800 font-bold">{selectedNocRecord.signed_by_mess_manager}</strong>
                  <span className="text-slate-500 block font-mono">{selectedNocRecord.clearance_timestamp}</span>
                </div>
                <div className="text-right">
                  <div className="w-24 border-b border-slate-400 pb-1 mb-1 font-mono text-[9px] text-slate-400 text-center">
                    [DIGITAL SIGNATURE]
                  </div>
                  <strong className="text-[#00236f] font-bold block">Bursar & Provost Council</strong>
                  <span className="text-[9px] text-slate-400">EduCore Autonomous Institutional System</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsNocModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
