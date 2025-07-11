import type { AuditLogEntry } from "./types";
import { getUsersContainer, getAuditLogsContainer } from "./cosmosdb";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import sgMail from '@sendgrid/mail';
import bcrypt from "bcryptjs";

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

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function createJWT(user: any, expiresIn: string = '15m') {
  // Only include safe fields in payload
  // For multi-role support, include all role associations
  const roleAssociations = user.roleAssociations || (user.role && user.societyId ? [{
    role: user.role,
    societyId: user.societyId,
    flatNumber: user.flatNumber,
    isActive: true
  }] : []);
  
  return jwt.sign(
    { 
      userId: user.id, 
      role: user.role, // Keep for backward compatibility
      societyId: user.societyId, // Keep for backward compatibility
      roleAssociations,
      isStaff: user.isStaff || false,
      canImpersonate: user.canImpersonate || false,
      impersonatingUserId: user.impersonatingUserId || null
    },
    JWT_SECRET as string,
    { expiresIn: expiresIn as any }
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

// Singleton nodemailer transporter
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// SendGrid integration
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail({
  to,
  subject,
  text,
  html,
  templateId,
  dynamicTemplateData
}: {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}) {
  try {
    const msg: any = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@resigate.com',
    };
    if (templateId) {
      msg.templateId = templateId;
      msg.dynamicTemplateData = dynamicTemplateData;
    } else {
      msg.subject = subject;
      msg.text = text;
      msg.html = html;
    }
    await sgMail.send(msg);
  } catch (err) {
    const safeErr = err instanceof Error ? err.message : String(err);
    console.error("Failed to send email to", to, ":", safeErr);
    throw err;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmailAndPassword(email: string, password: string) {
  const usersContainer = await getUsersContainer();
  const query = {
    query: "SELECT * FROM c WHERE c.email = @email",
    parameters: [{ name: "@email", value: email }],
  };
  const { resources } = await usersContainer.items.query(query).fetchAll();
  const user = resources[0];
  if (!user) return null;
  // Use bcrypt for password check if hash exists, fallback to plain for legacy
  if (user.passwordHash) {
    if (!(await verifyPassword(password, user.passwordHash))) return null;
  } else {
    if (user.password !== password) return null;
  }
  return user;
}
