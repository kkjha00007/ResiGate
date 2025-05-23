import type { User, VisitorEntry } from './types';
import { USER_ROLES } from './constants';

// In a real app, passwords would be hashed. For mock, storing plain text (not recommended for production).
export const MOCK_USERS: User[] = [
  {
    id: 'user-superadmin-001',
    email: 'admin@resigate.com',
    password: 'adminpassword',
    name: 'Super Admin',
    role: USER_ROLES.SUPERADMIN,
    isApproved: true,
    registrationDate: new Date('2023-01-01T10:00:00Z'),
  },
  {
    id: 'user-resident-001',
    email: 'resident101@resigate.com',
    password: 'residentpassword',
    name: 'Alice Smith',
    role: USER_ROLES.RESIDENT,
    flatNumber: 'A-101',
    isApproved: true,
    registrationDate: new Date('2023-01-15T11:00:00Z'),
  },
  {
    id: 'user-resident-002',
    email: 'resident202@resigate.com',
    password: 'residentpassword',
    name: 'Bob Johnson',
    role: USER_ROLES.RESIDENT,
    flatNumber: 'B-202',
    isApproved: false, // Pending approval
    registrationDate: new Date('2023-02-01T12:00:00Z'),
  },
];

export const MOCK_VISITOR_ENTRIES: VisitorEntry[] = [
  {
    id: 'visitor-001',
    visitorName: 'Charlie Brown',
    mobileNumber: '9876543210',
    purposeOfVisit: 'Delivery',
    flatNumber: 'A-101',
    entryTimestamp: new Date(new Date().setDate(new Date().getDate() -1)), // Yesterday
    vehicleNumber: 'DL1AB1234',
    enteredBy: 'user-superadmin-001', // Or a guard ID
  },
  {
    id: 'visitor-002',
    visitorName: 'Diana Prince',
    mobileNumber: '9876543211',
    purposeOfVisit: 'Guest Visit',
    flatNumber: 'A-101',
    entryTimestamp: new Date(new Date().setHours(new Date().getHours() -2)), // 2 hours ago
    enteredBy: 'user-superadmin-001',
  },
  {
    id: 'visitor-003',
    visitorName: 'Edward Nygma',
    mobileNumber: '9876543212',
    purposeOfVisit: 'Maintenance',
    flatNumber: 'B-202',
    entryTimestamp: new Date(new Date().setHours(new Date().getHours() - 5)), // 5 hours ago
    vehicleNumber: 'MH2CD5678',
    enteredBy: 'user-superadmin-001',
  },
];
