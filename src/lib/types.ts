
export type UserRole = "superadmin" | "resident";

export interface User {
  id: string; // Will be the Cosmos DB item ID
  email: string;
  password?: string; // Hashed password
  name: string;
  role: UserRole;
  flatNumber?: string; // Required for residents
  isApproved: boolean; // For residents
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
}

export interface LoginAudit {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  loginTimestamp: string; // ISO string
  // ipAddress?: string; // Optional: consider privacy implications
}
