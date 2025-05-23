export const APP_NAME = "ResiGate";

export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  RESIDENT: "resident",
} as const;

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
