export type UserRole = 
  | "owner_app"        // Platform admin
  | "ops"              // Operations team
  | "society_admin"    // Society administrator
  | "guard"            // Security guard
  | "owner_resident"   // Flat owner
  | "renter_resident"  // Tenant
  | "member_resident"  // Family member
  | "staff"            // Support staff
  | "api_system"       // System/API role
  // Legacy support
  | "superadmin"       // Maps to owner_app
  | "societyAdmin"     // Maps to society_admin
  | "owner"            // Maps to owner_resident
  | "renter";          // Maps to renter_resident

// Role association with society/flat
export interface UserRoleAssociation {
  id: string;
  userId: string;
  role: UserRole;
  societyId?: string;     // For society-scoped roles
  flatNumber?: string;    // For flat-scoped roles
  isActive: boolean;
  assignedAt: string;
  assignedBy: string;
  expiresAt?: string;     // Optional expiration
  // Custom permissions override defaults for this specific role association
  customPermissions?: { [feature: string]: string[] };
}

// Enhanced User interface with multi-role support
export interface User {
  id: string;
  email: string;
  password?: string; // Hashed password
  name: string;
  primaryRole: UserRole; // Main role for backward compatibility
  roleAssociations: UserRoleAssociation[]; // NEW: Multiple role associations
  societyId?: string; // Primary society (for backward compatibility)
  flatNumber?: string; // Primary flat (for backward compatibility)
  isApproved: boolean;
  registrationDate: string; // Store as ISO string
  secondaryPhoneNumber1?: string;
  secondaryPhoneNumber2?: string;
  // Password reset fields
  passwordResetToken?: string;
  passwordResetTokenExpiry?: number; // Unix timestamp (ms)
  themePreference?: 'light' | 'dark'; // Add theme preference for user
  vehicles?: Vehicle[];
  flatType?: string; // e.g., '1BHK', '2BHK', etc.
  creditBalance?: number; // NEW: advance/credit balance for auto-adjustment
  // Staff-specific fields
  staffType?: 'maid' | 'driver' | 'cook' | 'security' | 'maintenance' | 'other';
  isStaffLoginEnabled?: boolean; // Configurable staff login
  isStaff?: boolean; // Whether user is staff member
  // API access
  apiKey?: string; // For API_SYSTEM role
  lastLoginAt?: string;
  // Impersonation tracking
  impersonatedBy?: string; // User ID of who is impersonating
  impersonationStartedAt?: string;
  canImpersonate?: boolean; // Whether user can impersonate others
}

export interface Vehicle {
  number: string;
  type: 'car' | 'bike';
  notes?: string;
  addedAt?: string; // ISO DateTime string
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
  status?: 'pending' | 'approved' | 'denied'; // Add status for approval workflow
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
  status?: 'active' | 'expired'; // Add status for meeting expiry
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
  pincode?: string;
  city?: string;
  state?: string;
  country?: string;
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
  freezeUntil?: string | null; // ISO DateTime string, for rotational allocation freeze
  lastAllocatedAt?: string | null; // ISO DateTime string, for audit/history
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
  pincode?: string;
  city?: string;
  state?: string;
  country?: string;
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

export const FEEDBACK_STATUS_VALUES = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  UNDER_REVIEW: "under_review",
  REJECTED: "rejected",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;
export type FeedbackStatus = typeof FEEDBACK_STATUS_VALUES[keyof typeof FEEDBACK_STATUS_VALUES];

export interface FeedbackComment {
  authorId: string;
  authorName: string;
  comment: string;
  createdAt: string; // ISO DateTime
}

export interface FeedbackTicket {
  id: string;
  societyId?: string; // Optional for global tickets
  userId: string;
  userName: string;
  userEmail: string;
  flatNumber?: string;
  type: "bug" | "feature" | "feedback";
  subject: string;
  description: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt?: string;
  comments?: FeedbackComment[];
}

export interface HelpDeskRequest {
  id: string;
  userId: string;
  userName: string;
  flatNumber: string;
  category: string;
  description: string;
  urgent: boolean;
  status: 'open' | 'resolved';
  createdAt: string;
  updatedAt: string;
  documentUrl?: string;
  photoUrl?: string;
  comments?: Array<{
    by: string;
    byRole: string;
    comment: string;
    createdAt: string;
  }>;
}

export interface SOSAlert {
  id: string;
  societyId: string;
  userId: string;
  userName: string;
  flatNumber: string;
  message: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
  comments?: Array<{
    by: string;
    byRole: string;
    comment: string;
    createdAt: string;
  }>;
}

// --- Maintenance Billing & Accounting ---

export type BillStatus = 'unpaid' | 'paid' | 'overdue' | 'partially_paid' | 'cancelled';
export type BillApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';

// --- Audit Trail Entry for Bill/Config Changes ---
export interface AuditTrailEntry {
  id: string; // UUID for the audit entry
  changedBy: string; // userId
  changedByName?: string;
  changedByRole?: UserRole;
  changedAt: string; // ISO DateTime
  changeType: 'created' | 'updated' | 'deleted';
  field?: string; // Optional: field that changed (for single-field edits)
  before?: any; // Previous value or object snapshot
  after?: any; // New value or object snapshot
  notes?: string;
}

export interface MaintenanceBill {
  id: string;
  societyId: string;
  flatNumber: string;
  userId: string; // Owner/renter user id
  period: string; // e.g., '2025-06' (YYYY-MM)
  amount: number;
  dueDate: string; // ISO Date string
  status: BillStatus;
  approvalStatus?: BillApprovalStatus; // draft, pending_approval, approved, rejected, published
  generatedAt: string; // ISO DateTime
  paidAmount?: number;
  paidAt?: string; // ISO DateTime
  paymentIds?: string[]; // List of payment records
  notes?: string;
  breakdown?: Record<string, number>; // category key -> amount
  discountAmount?: number; // total discount applied (manual or auto)
  discountReason?: string; // e.g., 'Senior citizen waiver', 'Early payment'
  penaltyAmount?: number; // total penalty applied (manual or auto)
  penaltyReason?: string; // e.g., 'Late payment', 'Manual penalty'
  waiverAmount?: number; // total waiver applied (manual)
  waiverReason?: string; // e.g., 'Committee approved waiver'
  adHocCharges?: Array<{
    label: string;
    amount: number;
    description?: string;
    categoryKey?: string; // Optional: link to a category
    isOneTime?: boolean;
  }>;
  approvalHistory?: Array<{
    status: BillApprovalStatus;
    changedBy: string; // userId
    changedByName?: string;
    changedAt: string; // ISO DateTime
    notes?: string;
  }>;
  auditTrail?: AuditTrailEntry[]; // Full audit trail of all changes
  interestAmount?: number; // total interest applied (auto)
  interestReason?: string; // e.g., 'Overdue interest'
}

export interface Payment {
  id: string;
  societyId: string;
  billId?: string; // Optional: payment may be for a bill
  flatNumber: string;
  userId: string;
  amount: number;
  paymentDate: string; // ISO DateTime
  mode: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';
  referenceNumber?: string;
  notes?: string;
  recordedByUserId?: string; // Admin who recorded
}

// --- Bill Email Log ---
export interface BillEmailLog {
  id: string;
  billId: string;
  societyId: string;
  flatNumber: string;
  userId: string;
  email?: string;
  sentAt: string; // ISO DateTime
  status: 'sent' | 'failed' | 'no_email';
  errorMessage?: string; // e.g., 'Email not configured', SMTP error, etc.
}

export interface SocietyExpense {
  id: string;
  societyId: string;
  category: string;
  amount: number;
  expenseDate: string; // ISO DateTime
  description?: string;
  invoiceUrl?: string;
  createdByUserId: string;
  createdAt: string; // ISO DateTime
}

// --- Society Billing Template/Config ---
export interface SocietyBillingConfig {
  id: string; // societyId
  societyId: string;
  categories: Array<{
    key: string; // e.g., 'maintenance', 'sinkingFund', 'water', etc.
    label: string; // e.g., 'Maintenance', 'Sinking Fund', 'Water Charges'
    perFlatType: { [flatType: string]: number }; // e.g., { '1BHK': 1500, '2BHK': 2000 }
    isMandatory?: boolean;
    description?: string;
    chargeType?: 'recurring' | 'one-time'; // NEW: recurring or one-time
  }>;
  flatTypes: string[]; // e.g., ['1RK', '1BHK', '2BHK', '3BHK']
  effectiveFrom: string; // ISO date
  updatedAt: string; // ISO date
  penaltyRules?: {
    latePayment?: {
      enabled: boolean;
      daysAfterDue: number; // grace period
      rateType: 'fixed' | 'percent';
      amount: number; // fixed amount or percent per month
      maxAmount?: number;
      description?: string;
    }
  };
  discountRules?: Array<{
    key: string; // e.g., 'earlyPayment', 'seniorCitizen'
    label: string;
    type: 'auto' | 'manual';
    amount: number;
    rateType: 'fixed' | 'percent';
    description?: string;
    criteria?: any; // e.g., { beforeDays: 5 } for early payment
  }>;
  interestRules?: {
    enabled: boolean;
    daysAfterDue: number; // grace period before interest
    rateType: 'fixed' | 'percent'; // percent per month or fixed per month
    amount: number; // percent or fixed per month
    compounding?: 'monthly' | 'daily' | 'none'; // default: monthly
    maxAmount?: number; // optional cap
    perCategory?: boolean; // if true, interest applies per category
    description?: string;
  };
  auditTrail?: AuditTrailEntry[]; // Full audit trail of all changes
}

export interface BillReminderSchedule {
  userId: string;
  societyId: string;
  dayOfMonth: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  enabled: boolean;
  lastTriggered?: string; // ISO date
}

