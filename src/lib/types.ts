export type UserRole = "superadmin" | "resident";

export interface User {
  id: string;
  email: string;
  password?: string; // Store hashed passwords in a real app
  name: string;
  role: UserRole;
  flatNumber?: string; // Required for residents
  isApproved: boolean; // For residents, determines if their registration is approved
  registrationDate: Date;
}

export interface VisitorEntry {
  id: string;
  visitorName: string;
  mobileNumber: string;
  purposeOfVisit: string;
  flatNumber: string;
  entryTimestamp: Date;
  exitTimestamp?: Date;
  vehicleNumber?: string;
  visitorPhotoUrl?: string; // In a real app, this would be a URL to Azure Blob Storage
  enteredBy?: string; // User ID of the guard, system, or public source
  notes?: string;
  tokenCode?: string; // For public entries to show to guard
}
