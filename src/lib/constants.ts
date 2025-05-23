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
