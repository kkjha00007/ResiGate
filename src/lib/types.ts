
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

// Specifically for the neighbours list, only essential fields
export interface NeighbourProfile {
  id: string;
  name: string;
  flatNumber: string;
}


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
  isActive: boolean;
  monthYear: string;
}

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
  servicesOffered: string;
  submittedByUserId: string;
  submittedByName: string;
  submittedAt: string; // ISO DateTime string
  isApproved: boolean;
  approvedByUserId?: string;
  approvedAt?: string;
  notes?: string;
}

export const COMMITTEE_MEMBER_ROLES_VALUES = [
  "President",
  "Vice-President",
  "Secretary",
  "Joint-Secretary",
  "Treasurer",
  "Committee Member",
  "Advisor",
  "Other",
] as const;

export type CommitteeMemberRole = (typeof COMMITTEE_MEMBER_ROLES_VALUES)[number];

export interface CommitteeMember {
  id: string;
  name: string;
  roleInCommittee: CommitteeMemberRole;
  flatNumber: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SocietyPaymentDetails {
  id: "paymentDetailsDoc";
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
  upiId?: string;
  updatedAt?: string;
}

// Parking Management Types
export const PARKING_SPOT_TYPES_VALUES = ["car", "bike"] as const;
export type ParkingSpotType = (typeof PARKING_SPOT_TYPES_VALUES)[number];

export const PARKING_SPOT_STATUS_VALUES = ["available", "allocated"] as const;
export type ParkingSpotStatus = (typeof PARKING_SPOT_STATUS_VALUES)[number];


export interface ParkingSpot {
  id: string;
  spotNumber: string; // e.g., "A-01", "B-102"
  type: ParkingSpotType;
  location: string; // e.g., "Basement 1, Wing A", "Open Area Near Gate 2"
  status: ParkingSpotStatus;
  allocatedToFlatNumber?: string;
  allocatedToUserId?: string; // ID of the user (owner/renter) it's allocated to
  vehicleNumber?: string; // Primary vehicle using this spot
  notes?: string; // Any notes by admin
  createdAt: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
}

// Security Log Types
export const SECURITY_INCIDENT_SEVERITIES_VALUES = ["Low", "Medium", "High"] as const;
export type SecurityIncidentSeverity = (typeof SECURITY_INCIDENT_SEVERITIES_VALUES)[number];

export const SECURITY_INCIDENT_STATUSES_VALUES = ["New", "Under Review", "Action Taken", "Resolved", "Closed"] as const;
export type SecurityIncidentStatus = (typeof SECURITY_INCIDENT_STATUSES_VALUES)[number];

export interface SecurityIncident {
  id: string;
  reportedByUserId: string;
  reportedByUserName: string;
  reportedByUserFlatNumber?: string;
  incidentDateTime: string; // ISO DateTime string
  location: string;
  description: string;
  severity: SecurityIncidentSeverity;
  status: SecurityIncidentStatus;
  reportedAt: string; // ISO DateTime string
  adminNotes?: string;
  resolvedAt?: string; // ISO DateTime string
}
