import { NextRequest, NextResponse } from "next/server";
import { getFeedbackTicketsContainer } from "@/lib/cosmosdb";
import { getApiSessionUser } from '@/lib/api-session-user';
import { FEEDBACK_STATUS_VALUES } from '@/lib/types';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = (await getApiSessionUser(req));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing ticket id" }, { status: 400 });
  const container = await getFeedbackTicketsContainer();
  // First, read the ticket using id as partition key (for legacy support)
  let { resource: ticket } = await container.item(id, id).read();
  // If not found, try to find by querying (in case partition key is societyId)
  if (!ticket) {
    const query = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    };
    const { resources } = await container.items.query(query).fetchAll();
    ticket = resources[0];
  }
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if ((ticket.status || '').toLowerCase() !== FEEDBACK_STATUS_VALUES.OPEN.toLowerCase()) {
    return NextResponse.json({ error: `Only open tickets can be deleted. Current status: ${ticket.status}` }, { status: 400 });
  }
  if (user.role !== 'superadmin' && ticket.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Use ticket.societyId as the partition key for delete
  await container.item(id, ticket.societyId).delete();
  return NextResponse.json({ success: true });
}
