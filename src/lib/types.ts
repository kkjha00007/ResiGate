
export type UserRole = "superadmin" | "societyAdmin" | "owner" | "renter" | "guard";

export interface User {
  id: string;
  tenantId?: string; // This will be replaced by societyId in a later batch
  societyId?: string; // Placeholder for future, will be mandatory for most roles
  email: string;
  password?: string; // Hashed password
  name: string;
  role: UserRole;
  flatNumber?: string;
  isApproved: boolean;
  registrationDate: string; // Store as ISO string
  secondaryPhoneNumber1?: string;
  secondaryPhoneNumber2?: string;
}

export type UserProfile = Omit<User, 'password'>;

export interface NeighbourProfile {
  id: string;
  name: string;
  flatNumber: string;
}

export interface VisitorEntry {
  id: string;
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
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
  gatePassId?: string;
}

export interface LoginAudit {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  loginTimestamp: string; // ISO string
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
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
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
  residentUserId: string;
  residentFlatNumber: string;
  visitorName: string;
  expectedVisitDate: string; // ISO Date string
  visitDetailsOrTime: string;
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
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
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
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
  title: string;
  content: string;
  postedByUserId: string;
  postedByName: string;
  createdAt: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
  isActive: boolean;
  monthYear: string; // For partitioning
}

export interface Meeting {
  id: string;
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
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
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
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
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
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
  id: string; // Will become societyId
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
  upiId?: string;
  updatedAt?: string;
}

export interface SocietyInfoSettings {
  id: string; // Will become societyId
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
  societyName: string;
  registrationNumber?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  updatedAt?: string;
}


export const PARKING_SPOT_TYPES_VALUES = ["car", "bike"] as const;
export type ParkingSpotType = (typeof PARKING_SPOT_TYPES_VALUES)[number];

export const PARKING_SPOT_STATUS_VALUES = ["available", "allocated"] as const;
export type ParkingSpotStatus = (typeof PARKING_SPOT_STATUS_VALUES)[number];

export interface ParkingSpot {
  id: string;
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
  spotNumber: string;
  type: ParkingSpotType;
  location: string;
  status: ParkingSpotStatus;
  allocatedToFlatNumber?: string;
  allocatedToUserId?: string;
  vehicleNumber?: string;
  notes?: string;
  createdAt: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
}

export interface Facility {
  id: string;
  tenantId?: string; // To be replaced by societyId
  societyId?: string; // Placeholder
  name: string;
  description?: string;
  capacity?: number;
  bookingRules?: string; // Text field for general booking rules/notes
  isActive: boolean; // To enable/disable facility for booking
  createdAt: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
}

// New Society type
export interface Society {
  id: string; // Primary key, UUID
  name: string;
  city: string;
  isActive: boolean; // To deactivate a society if needed
  createdAt: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
}

    