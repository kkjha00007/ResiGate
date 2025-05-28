import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AuditLogEntry } from "./types";
import { auditLogsContainer } from "./cosmosdb";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function logAuditAction(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  const auditEntry: AuditLogEntry = {
    ...entry,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  try {
    await auditLogsContainer.items.create(auditEntry);
  } catch (err) {
    // Optionally log to console or external service
    console.error("Failed to log audit action:", err);
  }
}
