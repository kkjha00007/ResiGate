// This file is no longer needed as data persistence is handled by Azure Cosmos DB.
// The application will interact with the live database via API routes.
// For initial data seeding or testing with Cosmos DB, you would typically:
// 1. Write a script to populate your Cosmos DB instance.
// 2. Or, manually add a few records through the Azure portal or Cosmos DB Data Explorer.
//
// Keeping this file for reference or if you wish to adapt it for a seeding script later.
// However, it's not actively used by the application anymore.

import type { User, VisitorEntry } from './types';
import { USER_ROLES } from './constants';

// Example data, not used by the live application anymore.
export const MOCK_USERS_LEGACY: User[] = [
  {
    id: 'user-superadmin-001',
    email: 'admin@resigate.com',
    // IMPORTANT: Passwords should be HASHED. This is for conceptual reference only.
    password: 'adminpassword', 
    name: 'Super Admin',
    primaryRole: USER_ROLES.OWNER_APP,
    roleAssociations: [{
      id: 'role-assoc-001',
      userId: 'user-superadmin-001',
      role: USER_ROLES.OWNER_APP,
      isActive: true,
      assignedAt: new Date('2023-01-01T10:00:00Z').toISOString(),
      assignedBy: 'system'
    }],
    isApproved: true,
    registrationDate: new Date('2023-01-01T10:00:00Z').toISOString(),
    societyId: 'society-demo-001', // <-- Added for type compatibility
  },
  // Add other mock users if needed for a seeding script
];

export const MOCK_VISITOR_ENTRIES_LEGACY: VisitorEntry[] = [
  {
    id: 'visitor-001',
    societyId: 'society-demo-001', // <-- Added for type compatibility
    visitorName: 'Charlie Brown',
    mobileNumber: '9876543210',
    purposeOfVisit: 'Delivery',
    flatNumber: 'A-101',
    entryTimestamp: new Date(new Date().setDate(new Date().getDate() -1)).toISOString(),
    vehicleNumber: 'DL1AB1234',
    enteredBy: 'user-superadmin-001',
  },
  // Add other mock entries if needed for a seeding script
];
