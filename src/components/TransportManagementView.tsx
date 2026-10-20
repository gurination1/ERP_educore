import React, { useState } from 'react';
import {
  Bus,
  MapPin,
  Users,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  Phone,
  QrCode,
  Calendar,
  Zap,
  Building,
  UserCheck,
} from 'lucide-react';
import { User, TransportVehicle, TransportRoute, StudentBusPass } from '../types';

interface TransportManagementViewProps {
  currentUser: User | null;
}

export const TransportManagementView: React.FC<TransportManagementViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'routes' | 'passes' | 'maintenance'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Mock Vehicles (Karanvir Sir Lecture 4 Segments 7 & 8)
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([
    {
      id: 'vh-01',
      vehicle_number: 'PB 03 BA 1122',
      seater_capacity: 52,
      is_ac: true,
      ownership: 'college_owned',
      driver_name: 'Major Singh',
      driver_phone: '+91 98760 11223',
      driver_license_no: 'PB0320140029112',
      driver_type: 'college_staff',
      route_id: 'rt-01',
      route_name: 'Route 1: Bathinda City Bus Stand → Goniana → Campus',
      stops: ['Bus Stand', 'Civil Lines', 'Rose Garden', 'Goniana Mandi', 'Campus Gate 1'],
      total_allocated: 48,
      fitness_expiry_date: '2027-04-15',
      insurance_expiry_date: '2027-02-28',
      puc_expiry_date: '2026-12-10',
      maintenance_due_days: 74,
      is_active: true,
    },
    {
      id: 'vh-02',
      vehicle_number: 'PB 03 BC 4499',
      seater_capacity: 42,
      is_ac: false,
      ownership: 'vendor_leased',
      vendor_name: 'Kisan Travels Logistics & Fleet Services',
      vendor_contact: '+91 98141 66778 (Mr. Sukhdev Singh)',
      driver_name: 'Gurcharan Singh',
      driver_phone: '+91 94170 33445',
      driver_license_no: 'PB0320180099411',
      driver_type: 'contractor',
      route_id: 'rt-02',
      route_name: 'Route 2: Kotkapura → Jaitu → Bajakhana → Campus',
      stops: ['Kotkapura Chowk', 'Jaitu Mandi', 'Bajakhana', 'Campus Gate 2'],
      total_allocated: 42, // Full
      fitness_expiry_date: '2026-11-20',
      insurance_expiry_date: '2026-12-31',
      puc_expiry_date: '2026-10-28',
      maintenance_due_days: 12, // Alert countdown!
      is_active: true,
    },
    {
      id: 'vh-03',
      vehicle_number: 'PB 03 BE 9901',
      seater_capacity: 32,
      is_ac: true,
      ownership: 'college_owned',
      driver_name: 'Harbhajan Singh',
      driver_phone: '+91 98722 55441',
      driver_license_no: 'PB0320160044192',
      driver_type: 'college_staff',
      route_id: 'rt-03',
      route_name: 'Route 3: Rampura Phul → Bhucho Mandi → Campus Gate 1',
      stops: ['Rampura Mandi', 'Bhucho Kalan', 'Adesh Hospital Junction', 'Campus Gate 1'],
      total_allocated: 26,
      fitness_expiry_date: '2027-08-10',
      insurance_expiry_date: '2027-06-30',
      puc_expiry_date: '2027-01-15',
      maintenance_due_days: 156,
      is_active: true,
    },
  ]);

  // Mock Routes
  const [routes, setRoutes] = useState<TransportRoute[]>([
    {
      id: 'rt-01',
      route_code: 'RT-01',
      route_name: 'Route 1: Bathinda City Bus Stand → Goniana → Campus',
      start_point: 'Bathinda City Bus Stand',
      end_point: 'EduCore Main Campus (Gate 1)',
      pickup_time_morning: '07:45 AM',
      drop_time_evening: '04:45 PM',
      assigned_vehicle_id: 'vh-01',
      assigned_vehicle_number: 'PB 03 BA 1122',
      stops: [
        { stop_name: 'Bus Stand Counter 4', stop_sequence: 1, pickup_time: '07:45 AM', semester_fare: 2800 },
        { stop_name: 'Civil Lines Post Office', stop_sequence: 2, pickup_time: '07:55 AM', semester_fare: 2500 },
        { stop_name: 'Rose Garden Chowk', stop_sequence: 3, pickup_time: '08:05 AM', semester_fare: 2200 },
        { stop_name: 'Goniana Mandi Bypass', stop_sequence: 4, pickup_time: '08:20 AM', semester_fare: 1600 },
        { stop_name: 'EduCore Campus Gate 1', stop_sequence: 5, pickup_time: '08:40 AM', semester_fare: 0 },
      ],
      total_enrolled: 48,
      is_active: true,
    },
    {
      id: 'rt-02',
      route_code: 'RT-02',
      route_name: 'Route 2: Kotkapura → Jaitu → Bajakhana → Campus',
      start_point: 'Kotkapura Main Chowk',
      end_point: 'EduCore Main Campus (Gate 2)',
      pickup_time_morning: '07:20 AM',
      drop_time_evening: '05:00 PM',
      assigned_vehicle_id: 'vh-02',
      assigned_vehicle_number: 'PB 03 BC 4499',
      stops: [
        { stop_name: 'Kotkapura Chowk', stop_sequence: 1, pickup_time: '07:20 AM', semester_fare: 3500 },
        { stop_name: 'Jaitu Mandi Octroi Post', stop_sequence: 2, pickup_time: '07:45 AM', semester_fare: 2800 },
        { stop_name: 'Bajakhana Main Road', stop_sequence: 3, pickup_time: '08:10 AM', semester_fare: 2100 },
        { stop_name: 'EduCore Campus Gate 2', stop_sequence: 4, pickup_time: '08:45 AM', semester_fare: 0 },
      ],
      total_enrolled: 42,
      is_active: true,
    },
    {
      id: 'rt-03',
      route_code: 'RT-03',
      route_name: 'Route 3: Rampura Phul → Bhucho Mandi → Campus Gate 1',
      start_point: 'Rampura Phul Railway Crossing',
      end_point: 'EduCore Main Campus (Gate 1)',
      pickup_time_morning: '07:35 AM',
      drop_time_evening: '04:50 PM',
      assigned_vehicle_id: 'vh-03',
      assigned_vehicle_number: 'PB 03 BE 9901',
      stops: [
        { stop_name: 'Rampura Mandi Station', stop_sequence: 1, pickup_time: '07:35 AM', semester_fare: 3200 },
        { stop_name: 'Bhucho Kalan Bypass', stop_sequence: 2, pickup_time: '08:00 AM', semester_fare: 2400 },
        { stop_name: 'Adesh Hospital Junction', stop_sequence: 3, pickup_time: '08:15 AM', semester_fare: 1800 },
        { stop_name: 'EduCore Campus Gate 1', stop_sequence: 4, pickup_time: '08:40 AM', semester_fare: 0 },
      ],
      total_enrolled: 26,
      is_active: true,
    },
  ]);

  // Mock Bus Passes
  const [busPasses, setBusPasses] = useState<StudentBusPass[]>([
    {
      id: 'pass-01',
      pass_number: 'BP-2026-0041',
      student_uid: '1001-01-01-03-01',
      student_name: 'Aarav Sharma',
      course_name: 'B.Tech Computer Science & Engineering',
      semester: 3,
      route_id: 'rt-01',
      route_name: 'Route 1: Bathinda City Bus Stand → Goniana → Campus',
      boarding_stop: 'Rose Garden Chowk',
      vehicle_number: 'PB 03 BA 1122',
      seat_number: 'Seat 14 (Window)',
      issue_date: '2026-08-01',
      expiry_date: '2026-12-31',
      fee_status: 'paid',
      rfid_tag_id: 'RFID-99041288',
      status: 'active',
    },
    {
      id: 'pass-02',
      pass_number: 'BP-2026-0088',
      student_uid: '1001-01-05-03-01',
      student_name: 'Gurpreet Singh',
      course_name: 'B.Sc Agriculture (Hons)',
      semester: 1,
      route_id: 'rt-02',
      route_name: 'Route 2: Kotkapura → Jaitu → Bajakhana → Campus',
      boarding_stop: 'Jaitu Mandi Octroi Post',
      vehicle_number: 'PB 03 BC 4499',
      seat_number: 'Seat 22',
      issue_date: '2026-08-10',
      expiry_date: '2026-12-31',
      fee_status: 'paid',
      rfid_tag_id: 'RFID-44182901',
      status: 'active',
    },
  ]);

  // Unallocated transport students queue (applied for transport, awaiting seat)
  const [unallocatedScholars, setUnallocatedScholars] = useState([
    {
      uid: '1001-01-99-03-01',
      name: 'Harpreet Kaur',
      course: 'B.Sc Agriculture',
      preferredRoute: 'Route 1: Bathinda City Bus Stand → Goniana → Campus',
      stopRequested: 'Goniana Mandi Bypass',
      appliedDate: '2026-10-15',
      contact: '+91 98141 55667',
      isHosteller: false,
    },
    {
      uid: '1001-01-98-03-01',
      name: 'Manjot Singh',
      course: 'B.Tech ECE',
      preferredRoute: 'Route 1: Bathinda City Bus Stand → Goniana → Campus',
      stopRequested: 'Civil Lines Post Office',
      appliedDate: '2026-10-16',
      contact: '+91 98722 33445',
      isHosteller: false,
    },
    {
      uid: '1001-01-97-03-01',
      name: 'Simranjeet Virk',
      course: 'MBA Finance',
      preferredRoute: 'Route 3: Rampura Phul → Bhucho Mandi → Campus Gate 1',
      stopRequested: 'Bhucho Kalan Bypass',
      appliedDate: '2026-10-18',
      contact: '+91 94170 88990',
      isHosteller: true, // Violation of Mutual Exclusivity!
    },
  ]);

  // Modals state
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: '',
    seater_capacity: 52,
    is_ac: false,
    ownership: 'college_owned' as 'college_owned' | 'vendor_leased',
    vendor_name: '',
    vendor_contact: '',
    driver_name: '',
    driver_phone: '',
    driver_license_no: '',
    driver_type: 'college_staff' as 'college_staff' | 'contractor',
    route_name: '',
  });

  const [selectedPassForCard, setSelectedPassForCard] = useState<StudentBusPass | null>(null);

  // Allocation Modal
  const [isAllocatingModalOpen, setIsAllocatingModalOpen] = useState(false);
  const [allocatingStudent, setAllocatingStudent] = useState<any | null>(null);
  const [allocatingRouteId, setAllocatingRouteId] = useState('rt-01');
  const [allocatingStop, setAllocatingStop] = useState('');
  const [allocatingSeat, setAllocatingSeat] = useState('Seat 18');

  // Handle Add Vehicle
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.vehicle_number || !newVehicle.driver_name) {
      showToast('Please provide vehicle number and driver details', 'error');
      return;
    }

    const vehicle: TransportVehicle = {
      id: `vh-${Date.now()}`,
      vehicle_number: newVehicle.vehicle_number.toUpperCase(),
      seater_capacity: Number(newVehicle.seater_capacity),
      is_ac: newVehicle.is_ac,
      ownership: newVehicle.ownership,
      vendor_name: newVehicle.ownership === 'vendor_leased' ? newVehicle.vendor_name : undefined,
      vendor_contact: newVehicle.ownership === 'vendor_leased' ? newVehicle.vendor_contact : undefined,
      driver_name: newVehicle.driver_name,
      driver_phone: newVehicle.driver_phone,
      driver_license_no: newVehicle.driver_license_no,
      driver_type: newVehicle.driver_type,
      route_name: newVehicle.route_name || 'Unassigned',
      stops: [],
      total_allocated: 0,
      fitness_expiry_date: '2027-10-01',
      insurance_expiry_date: '2027-10-01',
      puc_expiry_date: '2027-04-01',
      maintenance_due_days: 90,
      is_active: true,
    };

    setVehicles([...vehicles, vehicle]);
    setIsAddVehicleModalOpen(false);
    showToast(`Vehicle ${vehicle.vehicle_number} successfully registered into transport fleet!`);
    setNewVehicle({
      vehicle_number: '',
      seater_capacity: 52,
      is_ac: false,
      ownership: 'college_owned',
      vendor_name: '',
      vendor_contact: '',
      driver_name: '',
      driver_phone: '',
      driver_license_no: '',
      driver_type: 'college_staff',
      route_name: '',
    });
  };

  // Handle Pass Allocation
  const handleAllocatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingStudent) return;

    // Strict Mutual Exclusivity Check (Karanvir Sir Lecture 4 Segment 7)
    if (allocatingStudent.isHosteller) {
      showToast(
        `MUTUAL EXCLUSIVITY VIOLATION: Candidate ${allocatingStudent.name} is registered as a Campus Hosteller! Hostel residents cannot hold an active daily bus transport pass.`,
        'error'
      );
      return;
    }

    const route = routes.find(r => r.id === allocatingRouteId);
    const vehicle = vehicles.find(v => v.id === route?.assigned_vehicle_id);

    const newPass: StudentBusPass = {
      id: `pass-${Date.now()}`,
      pass_number: `BP-2026-0${Math.floor(100 + Math.random() * 900)}`,
      student_uid: allocatingStudent.uid,
      student_name: allocatingStudent.name,
      course_name: allocatingStudent.course,
      semester: 1,
      route_id: allocatingRouteId,
      route_name: route?.route_name || 'Assigned Route',
      boarding_stop: allocatingStop || route?.stops[0]?.stop_name || 'Origin Stop',
      vehicle_number: vehicle?.vehicle_number || 'TBD',
      seat_number: allocatingSeat,
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: '2026-12-31',
      fee_status: 'paid',
      rfid_tag_id: `RFID-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'active',
    };

    setBusPasses([...busPasses, newPass]);
    setUnallocatedScholars(unallocatedScholars.filter(s => s.uid !== allocatingStudent.uid));
    setIsAllocatingModalOpen(false);
    setAllocatingStudent(null);
    showToast(`Digital Bus Pass ${newPass.pass_number} issued for ${newPass.student_name} (${newPass.seat_number})!`);
  };

  // Aggregate stats
  const totalFleetCount = vehicles.length;
  const totalCapacity = vehicles.reduce((acc, v) => acc + v.seater_capacity, 0);
  const totalAllocated = vehicles.reduce((acc, v) => acc + v.total_allocated, 0);
  const occupancyPercent = totalCapacity > 0 ? ((totalAllocated / totalCapacity) * 100).toFixed(1) : '0';
  const urgentMaintenanceCount = vehicles.filter(v => (v.maintenance_due_days || 100) < 30).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-sky-100 text-sky-800 border border-sky-200">
              Lecture 4 Segments 7 & 8 Mandate
            </span>
            <span className="text-xs text-slate-400 font-medium">Campus Operations & Fleet Logistics</span>
          </div>
          <h1 className="text-2xl font-black text-[#00236f] tracking-tight mt-1 flex items-center gap-2.5">
            <Bus className="w-7 h-7 text-[#00236f]" />
            Institutional Fleet & Bus Pass Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Fleet vehicle registration (32/40/52 seater), college-owned vs outsourced vendor contractors, route boarding points, stop-wise fee matrix, RFID bus passes, and 90/360-day statutory fitness cycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddVehicleModalOpen(true)}
            className="px-4 py-2.5 bg-[#00236f] hover:bg-[#001b54] text-white rounded-2xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Fleet Bus
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Fleet</span>
            <Bus className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalFleetCount} Buses</div>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">College + Vendor Leased</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Seat Capacity</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalCapacity} Seats</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{totalAllocated} Allocated ({occupancyPercent}%)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Active Routes</span>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{routes.length} Transit Corridors</div>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Bathinda, Kotkapura, Rampura</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Unallocated Queue</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{unallocatedScholars.length} Pending</div>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Scholars awaiting seat allocation</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Maintenance Alert</span>
            <Wrench className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{urgentMaintenanceCount} Urgent</div>
          <p className="text-[10px] text-rose-500 mt-0.5 font-medium">&lt;30 days fitness countdown</p>
        </div>
      </div>

      {/* Navigation Ribbon Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Fleet Overview & Allocation', icon: Bus },
          { id: 'fleet', label: 'Buses & Driver Roster', icon: Users },
          { id: 'routes', label: 'Corridors & Stop Fares', icon: MapPin },
          { id: 'passes', label: 'Active Student Bus Passes', icon: QrCode },
          { id: 'maintenance', label: 'Fitness & Statutory Renewals', icon: Wrench },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & QUEUE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Unallocated Scholars Queue */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#00236f] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Transport Intake Queue (Scholars Awaiting Seat Allocation)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scholars flagged with `is_transport_user: true` during admission or fee selection.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-[10px] font-bold border border-amber-200">
                  {unallocatedScholars.length} Pending
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {unallocatedScholars.map(scholar => (
                  <div key={scholar.uid} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{scholar.name}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {scholar.uid}
                        </span>
                        {scholar.isHosteller && (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Hosteller Violation
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>{scholar.course}</span>
                        <span>•</span>
                        <span className="text-slate-700 font-semibold">{scholar.preferredRoute}</span>
                        <span>•</span>
                        <span>Stop: <strong>{scholar.stopRequested}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAllocatingStudent(scholar);
                          setAllocatingStop(scholar.stopRequested);
                          setIsAllocatingModalOpen(true);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          scholar.isHosteller
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-[#00236f] hover:bg-[#001b54] text-white shadow-2xs'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {scholar.isHosteller ? 'Review Conflict' : 'Allot Seat & Pass'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Corridor Performance */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-[#00236f] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Corridor Occupancy & Transit Routes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {routes.map(route => {
                  const vehicle = vehicles.find(v => v.id === route.assigned_vehicle_id);
                  const capacity = vehicle?.seater_capacity || 40;
                  const percent = ((route.total_enrolled / capacity) * 100).toFixed(0);
                  return (
                    <div key={route.id} className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-[#00236f]">{route.route_code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          Number(percent) >= 100 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {percent}% Full
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate" title={route.route_name}>
                        {route.route_name}
                      </h4>
                      <div className="text-[10px] text-slate-500 space-y-0.5 font-medium">
                        <div>Bus: <strong>{route.assigned_vehicle_number}</strong> ({capacity} Seater)</div>
                        <div>Timing: {route.pickup_time_morning} → {route.drop_time_evening}</div>
                        <div>Stops: {route.stops.length} Boarding Points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Fleet Governance Invariant Card */}
          <div className="space-y-4">
            <div className="bg-sky-50/70 rounded-3xl p-5 border border-sky-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-sky-700" />
                Karanvir Sir Fleet Rules
              </div>
              <ul className="text-xs text-sky-900/90 space-y-2 list-disc list-inside leading-relaxed">
                <li>
                  <strong>Mutual Exclusivity:</strong> A student cannot have both active Hostel Room allotment and active Daily Bus Transport Pass simultaneously.
                </li>
                <li>
                  <strong>Ownership Tracking:</strong> Clearly separate College-Owned fleet from Vendor Contractor Leased buses (with vendor invoicing records).
                </li>
                <li>
                  <strong>Driver Verification:</strong> Full driver KYC with commercial driving license number and phone records.
                </li>
                <li>
                  <strong>Statutory Fitness Alert:</strong> Advance 360-day RTO fitness and 90-day maintenance alerts to prevent unroadworthy operations.
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Quick Action Links</h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('passes')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span>View All Active RFID Bus Passes</span>
                  <QrCode className="w-4 h-4 text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('maintenance')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span>Check PUC & Fitness Expiry Dates</span>
                  <Wrench className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLEET MANAGEMENT */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#00236f]">Bus Fleet & Driver Allocation Roster</h3>
                <p className="text-xs text-slate-500 mt-0.5">Master record of institutional and contractor buses.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVehicleModalOpen(true)}
                className="px-3.5 py-2 bg-[#00236f] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Bus
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Vehicle No</th>
                    <th className="py-2.5 px-3">Capacity</th>
                    <th className="py-2.5 px-3">AC / Non-AC</th>
                    <th className="py-2.5 px-3">Ownership</th>
                    <th className="py-2.5 px-3">Assigned Driver</th>
                    <th className="py-2.5 px-3">Assigned Route</th>
                    <th className="py-2.5 px-3">Fitness Due</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-black text-slate-900">{v.vehicle_number}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {v.seater_capacity} Seater ({v.total_allocated} Occ.)
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.is_ac ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {v.is_ac ? 'AC Air-Suspension' : 'Standard Non-AC'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {v.ownership === 'college_owned' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            College Owned
                          </span>
                        ) : (
                          <div className="text-[11px]">
                            <span className="text-amber-700 font-semibold block">Vendor Contractor</span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">{v.vendor_name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{v.driver_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{v.driver_phone}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium max-w-[200px] truncate" title={v.route_name}>
                        {v.route_name}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          (v.maintenance_due_days || 100) < 30 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {v.maintenance_due_days} Days Left
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active Fleet
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROUTES & STOPS */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#00236f]">Transit Corridors & Stop-Wise Fare Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stops, timing schedules, and semester transportation fees per boarding point.
              </p>
            </div>

            <div className="space-y-4">
              {routes.map(r => (
                <div key={r.id} className="p-4 border border-slate-200 rounded-2xl space-y-3 bg-slate-50/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs bg-[#00236f] text-white px-2 py-0.5 rounded">
                          {r.route_code}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{r.route_name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Vehicle: <strong>{r.assigned_vehicle_number}</strong> • Pickup: <strong>{r.pickup_time_morning}</strong> • Drop: <strong>{r.drop_time_evening}</strong>
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl self-start sm:self-auto">
                      {r.total_enrolled} Scholars Enrolled
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2 px-3">Stop Seq</th>
                          <th className="py-2 px-3">Boarding Point</th>
                          <th className="py-2 px-3">Morning Pickup</th>
                          <th className="py-2 px-3 text-right">Semester Fare</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {r.stops.map(stop => (
                          <tr key={stop.stop_sequence}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-600">#{stop.stop_sequence}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{stop.stop_name}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{stop.pickup_time}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {stop.semester_fare === 0 ? 'Destination (Campus)' : `₹ ${(stop.semester_fare || 0).toLocaleString('en-IN')}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BUS PASSES */}
      {activeTab === 'passes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#00236f]">Active Student Digital Bus Passes (RFID Linked)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Authorised transport users with validated semester fee receipts.</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search UID or student name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Pass Number</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">UID</th>
                    <th className="py-2.5 px-3">Route & Boarding Stop</th>
                    <th className="py-2.5 px-3">Vehicle & Seat</th>
                    <th className="py-2.5 px-3">RFID Tag</th>
                    <th className="py-2.5 px-3 text-right">Card Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {busPasses
                    .filter(
                      p =>
                        p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.student_uid.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(pass => (
                      <tr key={pass.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#00236f]">{pass.pass_number}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{pass.student_name}</div>
                          <div className="text-[10px] text-slate-500">{pass.course_name} (Sem {pass.semester})</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{pass.student_uid}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{pass.boarding_stop}</div>
                          <div className="text-[10px] text-slate-400">{pass.route_name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{pass.vehicle_number}</div>
                          <div className="text-[10px] text-emerald-600 font-bold">{pass.seat_number}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-slate-500">{pass.rfid_tag_id}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedPassForCard(pass)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            View Digital Pass
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

      {/* TAB 5: MAINTENANCE & STATUTORY RENEWALS */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#00236f] flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-rose-600" />
                  Statutory Vehicle Fitness & Mechanical Maintenance Cycle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  RTO compliance, PUC emission certs, insurance policies, and mechanical service logs.
                </p>
              </div>
              <span className="px-3 py-1 bg-sky-50 text-sky-800 rounded-full text-xs font-bold border border-sky-200">
                Quarterly 90-Day Inspection Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vehicles.map(v => (
                <div key={v.id} className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-slate-50/60">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono font-black text-slate-900">{v.vehicle_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      (v.maintenance_due_days || 100) < 30 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {v.maintenance_due_days} Days to Service
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">RTO Fitness Expiry:</span>
                      <span className="font-mono font-semibold">{v.fitness_expiry_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Insurance Expiry:</span>
                      <span className="font-mono font-semibold">{v.insurance_expiry_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PUC Emission Expiry:</span>
                      <span className="font-mono font-semibold">{v.puc_expiry_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Driver License:</span>
                      <span className="font-mono font-semibold">{v.driver_license_no}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(`Work order issued for mechanical & brake overhaul for ${v.vehicle_number}!`)}
                    className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Log Periodic Inspection
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER NEW BUS */}
      {isAddVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <Bus className="w-5 h-5 text-[#00236f]" />
                Register New Fleet Bus
              </h3>
              <button
                type="button"
                onClick={() => setIsAddVehicleModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Vehicle Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PB 03 BA 9911"
                  value={newVehicle.vehicle_number}
                  onChange={e => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Seater Capacity</label>
                  <select
                    value={newVehicle.seater_capacity}
                    onChange={e => setNewVehicle({ ...newVehicle, seater_capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value={32}>32-Seater (Mini Bus)</option>
                    <option value={42}>42-Seater (Standard)</option>
                    <option value={52}>52-Seater (Heavy Coach)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cooling Spec</label>
                  <select
                    value={newVehicle.is_ac ? 'true' : 'false'}
                    onChange={e => setNewVehicle({ ...newVehicle, is_ac: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="false">Standard Non-AC</option>
                    <option value="true">Air Conditioned (AC)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fleet Ownership</label>
                  <select
                    value={newVehicle.ownership}
                    onChange={e => setNewVehicle({ ...newVehicle, ownership: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="college_owned">College Owned</option>
                    <option value="vendor_leased">Vendor Contractor Leased</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Corridor</label>
                  <select
                    value={newVehicle.route_name}
                    onChange={e => setNewVehicle({ ...newVehicle, route_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="">Select Route Corridor</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.route_name}>
                        {r.route_code}: {r.start_point}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newVehicle.ownership === 'vendor_leased' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div>
                    <label className="block text-amber-900 font-bold mb-1">Vendor Firm Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kisan Logistics"
                      value={newVehicle.vendor_name}
                      onChange={e => setNewVehicle({ ...newVehicle, vendor_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-900 font-bold mb-1">Vendor Contact</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98141 11223"
                      value={newVehicle.vendor_contact}
                      onChange={e => setNewVehicle({ ...newVehicle, vendor_contact: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Driver KYC & Assignment</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Driver Full Name"
                    value={newVehicle.driver_name}
                    onChange={e => setNewVehicle({ ...newVehicle, driver_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Driver Mobile (+91)"
                    value={newVehicle.driver_phone}
                    onChange={e => setNewVehicle({ ...newVehicle, driver_phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Commercial DL Number"
                    value={newVehicle.driver_license_no}
                    onChange={e => setNewVehicle({ ...newVehicle, driver_license_no: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono"
                  />
                  <select
                    value={newVehicle.driver_type}
                    onChange={e => setNewVehicle({ ...newVehicle, driver_type: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="college_staff">Regular Staff Driver</option>
                    <option value="contractor">Vendor Contractor Driver</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00236f] text-white rounded-xl font-black cursor-pointer hover:bg-[#001b54]"
                >
                  Register Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ALLOCATE BUS SEAT & PASS */}
      {isAllocatingModalOpen && allocatingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#00236f]" />
                Allot Bus Seat & Issue Digital Pass
              </h3>
              <button
                type="button"
                onClick={() => setIsAllocatingModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {allocatingStudent.isHosteller && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 space-y-1">
                  <strong>Strict Mutual Exclusivity Violation Detected!</strong>
                  <p>
                    Student {allocatingStudent.name} is currently residing in campus hostel accommodations. Per Indian College ERP Ordinance (Karanvir Sir Lecture 4 Segment 7), hostellers cannot hold an active bus transport pass. The student must first cancel their hostel allotment before acquiring bus transport.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleAllocatePass} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-sm font-bold text-slate-900">{allocatingStudent.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                  <span>{allocatingStudent.uid}</span>
                  <span>•</span>
                  <span>{allocatingStudent.course}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Transit Route</label>
                <select
                  value={allocatingRouteId}
                  onChange={e => {
                    setAllocatingRouteId(e.target.value);
                    const r = routes.find(rt => rt.id === e.target.value);
                    if (r && r.stops.length > 0) {
                      setAllocatingStop(r.stops[0].stop_name);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.route_code}: {r.route_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Designated Boarding Stop</label>
                <select
                  value={allocatingStop}
                  onChange={e => setAllocatingStop(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {routes
                    .find(r => r.id === allocatingRouteId)
                    ?.stops.map(s => (
                      <option key={s.stop_sequence} value={s.stop_name}>
                        {s.stop_name} (Fare: ₹{(s.semester_fare || 0).toLocaleString('en-IN')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Seat Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seat 16 (Aisle)"
                  value={allocatingSeat}
                  onChange={e => setAllocatingSeat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocatingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocatingStudent.isHosteller}
                  className={`px-5 py-2 rounded-xl font-black transition-all ${
                    allocatingStudent.isHosteller
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#00236f] hover:bg-[#001b54] text-white cursor-pointer'
                  }`}
                >
                  Issue Digital Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW DIGITAL BUS PASS CARD */}
      {selectedPassForCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Digital RFID Bus Pass</span>
              <button
                type="button"
                onClick={() => setSelectedPassForCard(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Card Preview */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#00236f] to-[#001740] text-white space-y-4 shadow-lg text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-sky-200 font-bold">EduCore Collegiate Transport</div>
                  <div className="text-xs font-black font-mono mt-0.5">{selectedPassForCard.pass_number}</div>
                </div>
                <Bus className="w-5 h-5 text-sky-300" />
              </div>

              <div className="space-y-1">
                <div className="text-base font-black tracking-tight">{selectedPassForCard.student_name}</div>
                <div className="text-[10px] text-sky-200 font-mono">{selectedPassForCard.student_uid}</div>
                <div className="text-[10px] text-slate-300 truncate">{selectedPassForCard.course_name}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/10 p-2.5 rounded-xl border border-white/10">
                <div>
                  <span className="text-slate-300 block text-[9px]">Boarding Point:</span>
                  <span className="font-bold text-white">{selectedPassForCard.boarding_stop}</span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[9px]">Seat Assigned:</span>
                  <span className="font-bold text-amber-300">{selectedPassForCard.seat_number}</span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[9px]">Bus Number:</span>
                  <span className="font-bold text-white font-mono">{selectedPassForCard.vehicle_number}</span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[9px]">Valid Until:</span>
                  <span className="font-bold text-emerald-300 font-mono">{selectedPassForCard.expiry_date}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[8px] font-mono text-sky-200">
                  TAG: {selectedPassForCard.rfid_tag_id}
                </div>
                <div className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-400 text-[#00236f]">
                  ✓ PAID & VERIFIED
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                showToast(`Printing pass ${selectedPassForCard.pass_number}...`);
                setSelectedPassForCard(null);
              }}
              className="w-full py-2 bg-[#00236f] text-white rounded-xl text-xs font-black hover:bg-[#001b54] cursor-pointer"
            >
              Print Physical Smart Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
