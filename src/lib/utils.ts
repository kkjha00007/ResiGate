import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// WARNING: This file must remain CLIENT-SAFE. Do NOT import any server-only code (Cosmos DB, JWT, etc) here.
// All server-only utilities must go in src/lib/server-utils.ts

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
