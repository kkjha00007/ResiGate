import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getFeedbackTicketsContainer } from "@/lib/cosmosdb";
import { FeedbackTicket, FeedbackStatus, FeedbackComment, FEEDBACK_STATUS_VALUES } from "@/lib/types";
const FEEDBACK_STATUS_SET = new Set(Object.values(FEEDBACK_STATUS_VALUES));
import { getApiSessionUser } from '../../../lib/api-session-user';

// Helper: Check if user is superadmin
interface ApiSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  societyId?: string;
  flatNumber?: string;
}

function isSuperAdmin(user: ApiSessionUser) {
  return user?.role === "superadmin";
}

// GET: List tickets (SuperAdmin: all, others: own)
export async function GET(req: NextRequest) {
  const user = (await getApiSessionUser(req)) as ApiSessionUser | null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const container = await getFeedbackTicketsContainer();
  let query = isSuperAdmin(user)
    ? "SELECT * FROM c ORDER BY c.createdAt DESC"
    : `SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC`;
  let parameters = isSuperAdmin(user) ? [] : [{ name: "@userId", value: user.id }];
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  return NextResponse.json(resources as FeedbackTicket[]);
}

// POST: Create new ticket
export async function POST(req: NextRequest) {
  const user = (await getApiSessionUser(req)) as ApiSessionUser | null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type, subject, description } = await req.json();
  if (!type || !subject || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const ticket: FeedbackTicket = {
    id: uuidv4(),
    societyId: user.societyId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    flatNumber: user.flatNumber || '',
    type,
    subject,
    description,
    status: FEEDBACK_STATUS_VALUES.OPEN,
    createdAt: now,
    updatedAt: now,
    comments: [],
  };
  const container = await getFeedbackTicketsContainer();
  await container.items.create(ticket);
  return NextResponse.json(ticket, { status: 201 });
}

// PATCH: Update status or add comment
export async function PATCH(req: NextRequest) {
  const user = (await getApiSessionUser(req)) as ApiSessionUser | null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status, comment } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing ticket id" }, { status: 400 });
  const container = await getFeedbackTicketsContainer();
  const { resource: ticket } = await container.item(id, id).read<FeedbackTicket>();
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (!isSuperAdmin(user) && ticket.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let updated = false;
  if (status && FEEDBACK_STATUS_SET.has(status)) {
    // Only SuperAdmin can change status, or owner if status is 'open'
    if (isSuperAdmin(user) || (ticket.userId === user.id && ticket.status === FEEDBACK_STATUS_VALUES.OPEN)) {
      ticket.status = status;
      updated = true;
    } else {
      return NextResponse.json({ error: "Forbidden to change status" }, { status: 403 });
    }
  }
  if (comment && typeof comment === "string" && comment.trim()) {
    // Allow any logged-in user to add a comment
    const feedbackComment: FeedbackComment = {
      authorId: user.id,
      authorName: user.name,
      comment,
      createdAt: new Date().toISOString(),
    };
    ticket.comments = ticket.comments || [];
    ticket.comments.push(feedbackComment);
    updated = true;
  }
  if (!updated) return NextResponse.json({ error: "No valid update" }, { status: 400 });
  ticket.updatedAt = new Date().toISOString();
  await container.items.upsert(ticket);
  return NextResponse.json(ticket);
}

// DELETE: Only if open, by owner or SuperAdmin
// (Removed to avoid conflict with /api/feedback/[id] route)
// export async function DELETE(req: NextRequest) {
//   const user = (await getApiSessionUser(req)) as ApiSessionUser | null;
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const { id } = await req.json();
//   if (!id) return NextResponse.json({ error: "Missing ticket id" }, { status: 400 });
//   const container = await getFeedbackTicketsContainer();
//   const { resource: ticket } = await container.item(id, id).read<FeedbackTicket>();
//   if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
//   if ((ticket.status || '').toLowerCase() !== FEEDBACK_STATUS_VALUES.OPEN.toLowerCase()) {
//     return NextResponse.json({ error: `Only open tickets can be deleted. Current status: ${ticket.status}` }, { status: 400 });
//   }
//   if (!isSuperAdmin(user) && ticket.userId !== user.id) {
//     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//   }
//   await container.item(id, id).delete();
//   return NextResponse.json({ success: true });
// }
