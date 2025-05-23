
export type UserRole = "superadmin" | "owner" | "renter" | "guard"; // Updated roles

export interface User {
  id: string; // Will be the Cosmos DB item ID
  email: string;
  password?: string; // Hashed password
  name: string;
  role: UserRole;
  flatNumber?: string; // Required for owners and renters, 'NA' for guard
  isApproved: boolean;
  registrationDate: string; // Store as ISO string (e.g., new Date().toISOString())
  secondaryPhoneNumber1?: string;
  secondaryPhoneNumber2?: string;
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
  residentUserId: string;
  residentFlatNumber: string;
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

// Complaint Feature Types
export const COMPLAINT_STATUSES_VALUES = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
} as const;
export type ComplaintStatus = typeof COMPLAINT_STATUSES_VALUES[keyof typeof COMPLAINT_STATUSES_VALUES];

export const COMPLAINT_CATEGORIES_VALUES = [
  "Maintenance",
  "Security",
  "Noise",
  "Parking",
  "Cleanliness",
  "Staff Behavior",
  "Common Area",
  "Pet Related",
  "Other",
] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES_VALUES)[number];


export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userFlatNumber: string;
  subject: string;
  category: ComplaintCategory;
  description: string;
  submittedAt: string; // ISO DateTime string
  status: ComplaintStatus;
  adminNotes?: string;
  resolvedAt?: string; // ISO DateTime string
}

// Notice Feature Types
export interface Notice {
  id: string;
  title: string;
  content: string;
  postedByUserId: string;
  postedByName: string;
  createdAt: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
  isActive: boolean;
  monthYear: string; // For partitioning, e.g., "YYYY-MM"
}

// Meeting Feature Types
export interface Meeting {
  id: string;
  title: string;
  description: string;
  dateTime: string; // ISO DateTime string
  locationOrLink: string;
  postedByUserId: string;
  postedByName: string;
  createdAt: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
  isActive: boolean; // To easily enable/disable if needed
  monthYear: string; // For partitioning, e.g., "YYYY-MM" derived from dateTime
}

// Vendor Directory Types
export const VENDOR_CATEGORIES_LIST = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Groceries",
  "Milk Delivery",
  "Newspaper Delivery",
  "Laundry",
  "House Keeping",
  "Cook/Chef",
  "Pest Control",
  "Internet Provider",
  "Cable TV",
  "AC Repair",
  "Appliance Repair",
  "Pharmacy",
  "Doctor/Clinic",
  "Tiffin Service",
  "Other Services",
] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES_LIST)[number];

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactPerson?: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  address?: string;
  servicesOffered: string; // Could be a brief description or comma-separated list
  submittedByUserId: string;
  submittedByName: string;
  submittedAt: string; // ISO DateTime string
  isApproved: boolean;
  approvedByUserId?: string; // Superadmin's ID
  approvedAt?: string; // ISO DateTime string
  notes?: string; // Any additional notes by submitter or admin
}

// Committee Member Type
export interface CommitteeMember {
  id: string;
  name: string;
  roleInCommittee: string;
  flatNumber: string;
  imageUrl?: string; // Optional, can be placeholder
  email?: string;
  phone?: string;
  createdAt?: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
}

// Society Payment Details Type
export interface SocietyPaymentDetails {
  id: "paymentDetailsDoc"; // Fixed ID for the single document
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
  upiId?: string; // Optional: For future QR code generation
  updatedAt?: string; // ISO DateTime string
}
