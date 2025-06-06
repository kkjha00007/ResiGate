export type UserRole = "superadmin" | "societyAdmin" | "owner" | "renter" | "guard";

export interface User {
  id: string;
  societyId: string; // Now required for all users
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
  societyId: string; // Now required
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
  societyId: string; // Now required
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

export interface ComplaintReply {
  reply: string;
  repliedAt: string;
  repliedBy?: string;
  repliedById?: string;
}

export interface Complaint {
  id: string;
  societyId: string; // Now required
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
  replies?: ComplaintReply[];
}

export interface Notice {
  id: string;
  societyId: string; // Now required
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
  societyId: string; // Now required
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
  societyId: string; // Now required
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
  societyId: string; // Now required
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
  societyId: string; // Now required
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
  societyId: string; // Now required
  societyName: string;
  registrationNumber?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  updatedAt?: string;
  importantContacts?: { label: string; value: string }[]; // Added for persistent contacts
}


export const PARKING_SPOT_TYPES_VALUES = ["car", "bike"] as const;
export type ParkingSpotType = (typeof PARKING_SPOT_TYPES_VALUES)[number];

export const PARKING_SPOT_STATUS_VALUES = ["available", "allocated"] as const;
export type ParkingSpotStatus = (typeof PARKING_SPOT_STATUS_VALUES)[number];

export interface ParkingSpot {
  id: string;
  societyId: string; // Now required
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
  societyId: string; // Now required
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

export interface AuditLogEntry {
  id: string;
  societyId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g., "CREATE_NOTICE"
  targetType: string; // e.g., "Notice", "User"
  targetId?: string; // e.g., noticeId, userId
  timestamp: string; // ISO string
  details?: any; // JSON object with extra info (before/after, etc.)
  ipAddress?: string;
  userAgent?: string;
}

export interface Persona {
  id: string;
  societyId?: string; // If undefined, global persona (SuperAdmin only)
  name: string;
  description?: string;
  roleKeys: UserRole[];
  featureAccess: {
    [featureKey: string]: boolean;
  };
}

export interface ParkingRequest {
  id: string;
  userId: string;
  userName: string;
  flatNumber: string;
  societyId: string;
  type: 'car' | 'bike' | 'both';
  vehicleNumber: string;
  notes?: string;
  status: 'pending' | 'approved' | 'queued' | 'rejected';
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string; // e.g. 'notice', 'approval', 'booking', etc.
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

