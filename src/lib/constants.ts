
import type { VendorCategory, CommitteeMemberRole, ParkingSpotType, ParkingSpotStatus } from "./types";

export const APP_NAME = "ResiGate";

export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  OWNER: "owner", 
  RENTER: "renter", 
  GUARD: "guard",
} as const;

export const SELECTABLE_USER_ROLES: Exclude<UserRole, "superadmin">[] = ["owner", "renter", "guard"];


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


export const COMPLAINT_STATUSES_LIST = [
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
