
export type UserRole = "superadmin" | "owner" | "renter" | "guard"; // Updated roles

export interface User {
  id: string; // Will be the Cosmos DB item ID
  email: string;
  password?: string; // Hashed password
  name: string;
  role: UserRole;
  flatNumber?: string; // Required for owners and renters
  isApproved: boolean;
  registrationDate: string; // Store as ISO string (e.g., new Date().toISOString())
}

// For sending user data to client, omitting sensitive fields like password
export type UserProfile = Omit<User, 'password'>;


export interface VisitorEntry {
  id: string; // Will be the Cosmos DB item ID
  visitorName: string;
  mobileNumber: string;
  purposeOfVisit: string;
  flatNumber: string;
  entryTimestamp: string; // Store as ISO string
  exitTimestamp?: string; // Store as ISO string
  vehicleNumber?: string;
  visitorPhotoUrl?: string;
  enteredBy?: string; // User ID or public source
  notes?: string;
  tokenCode?: string;
  gatePassId?: string; // Optional: Link to the gate pass if entry is via a pass
}

export interface LoginAudit {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  loginTimestamp: string; // ISO string
  // ipAddress?: string; // Optional: consider privacy implications
}

export const GATE_PASS_STATUSES = {
  PENDING: "Pending",
  USED: "Used",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
} as const;

export type GatePassStatus = typeof GATE_PASS_STATUSES[keyof typeof GATE_PASS_STATUSES];

export interface GatePass {
  id: string;
  residentUserId: string; // Changed from user.id to residentUserId for clarity
  residentFlatNumber: string; // Changed from flatNumber
  visitorName: string;
  expectedVisitDate: string; // ISO Date string (e.g., "2024-12-25")
  visitDetailsOrTime: string; // e.g., "Evening", "Around 2 PM", "Full Day"
  purposeOfVisit: string;
  vehicleNumber?: string;
  notes?: string;
  tokenCode: string;
  status: GatePassStatus;
  createdAt: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
}
