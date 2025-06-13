import { getApiSessionUser } from '@/lib/api-session-user';
import { redirect } from 'next/navigation';
import type { HelpDeskRequest } from '@/lib/types';
import AdminHelpDeskUI from './AdminHelpDeskUI';

async function getHelpDeskRequests(societyId: string): Promise<HelpDeskRequest[]> {
  const { getHelpDeskRequestsContainer } = await import('@/lib/cosmosdb');
  const container = getHelpDeskRequestsContainer();
  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.societyId = @societyId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@societyId', value: societyId }],
    })
    .fetchAll();
  return resources;
}

export default async function AdminHelpDeskPage() {
  const user = await getApiSessionUser();
  if (!user || (user.role !== 'societyAdmin' && user.role !== 'superadmin')) {
    redirect('/dashboard/no-access');
  }
  const requests = await getHelpDeskRequests(user.societyId);
  return <AdminHelpDeskUI user={user} initialRequests={requests} />;
}
