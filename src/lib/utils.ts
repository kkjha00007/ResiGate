import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AuditLogEntry } from "./types";
import { getUsersContainer, getAuditLogsContainer } from "./cosmosdb";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

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
    const auditLogsContainer = getAuditLogsContainer();
    await auditLogsContainer.items.create(auditEntry);
  } catch (err) {
    // Optionally log to console or external service
    console.error("Failed to log audit action:", err);
  }
}

// --- Auth/session helpers (implement securely in production) ---

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function getUserByEmailAndPassword(email: string, password: string) {
  const usersContainer = await getUsersContainer();
  // Replace with secure password hash check in production
  const query = {
    query: "SELECT * FROM c WHERE c.email = @email",
    parameters: [{ name: "@email", value: email }],
  };
  const { resources } = await usersContainer.items.query(query).fetchAll();
  const user = resources[0];
  if (!user) return null;
  // In production, compare hashed password
  if (user.password !== password) return null;
  return user;
}

export async function createJWT(user: any) {
  // Only include safe fields in payload
  return jwt.sign(
    { userId: user.id, role: user.role, societyId: user.societyId },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
}

export async function verifyJWT(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getUserById(userId: string, societyId: string) {
  const usersContainer = await getUsersContainer();
  try {
    const { resource } = await usersContainer.item(userId, societyId).read();
    return resource;
  } catch {
    return null;
  }
}
