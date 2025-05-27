
import type { VendorCategory, CommitteeMemberRole, ParkingSpotType, ParkingSpotStatus, UserRole } from "./types";

export const APP_NAME = "ResiGate";

export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  SOCIETY_ADMIN: "societyAdmin", // New role
  OWNER: "owner",
  RENTER: "renter",
  GUARD: "guard",
} as const;

// Explicitly type UserRole based on the values of USER_ROLES
// export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]; // This is now in types.ts to avoid circular deps

export const SELECTABLE_USER_ROLES: Exclude<UserRole, "superadmin" | "societyAdmin">[] = ["owner", "renter", "guard"];


export const LOCAL_STORAGE_KEYS = {
  USERS: "resiGateUsers",
  VISITORS: "resiGateVisitors",
  LOGGED_IN_USER: "resiGateLoggedInUser",
};

export const VISIT_PURPOSES = [
  "Delivery",
  "Guest Visit",
  "Maintenance/Service",
  "Enquiry",
  "Staff/Employee",
  "Cab/Taxi",
  "Sales/Vendor",
  "Interview",
  "Other",
] as const;

export const PUBLIC_ENTRY_SOURCE = "PUBLIC_QR_SCAN";

export const GATE_PASS_STATUSES_ARRAY = ["Pending", "Used", "Cancelled", "Expired"] as const;

export const DEFAULT_ITEMS_PER_PAGE = 10;


export const COMPLAINT_STATUSES = [ // Renamed for clarity
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
] as const;

export const COMPLAINT_CATEGORIES_LIST = [
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

export const VENDOR_CATEGORIES: VendorCategory[] = [
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
];

export const COMMITTEE_MEMBER_ROLES: CommitteeMemberRole[] = [
  "President",
  "Vice-President",
  "Secretary",
  "Joint-Secretary",
  "Treasurer",
  "Committee Member",
  "Advisor",
  "Other",
];

// Parking Management Constants
export const PARKING_SPOT_TYPES: ParkingSpotType[] = ["car", "bike"];
export const PARKING_SPOT_STATUSES: ParkingSpotStatus[] = ["available", "allocated"];

// Reverted Security Log constants
// export const SECURITY_INCIDENT_SEVERITIES = ["Low", "Medium", "High"] as const;
// export const SECURITY_INCIDENT_STATUSES = ["New", "Under Review", "Action Taken", "Resolved", "Closed"] as const;


    