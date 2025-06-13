import { getApiSessionUser } from '@/lib/api-session-user';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import type { SOSAlert } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import SOSAlertsList from './SOSAlertsList';

async function getSOSAlerts(societyId: string): Promise<SOSAlert[]> {
  const { getSOSAlertsContainer } = await import('@/lib/cosmosdb');
  const container = getSOSAlertsContainer();
  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.societyId = @societyId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@societyId', value: societyId }],
    })
    .fetchAll();
  return resources;
}

export default async function AdminSOSAlertsPage() {
  const user = await getApiSessionUser();
  if (!user || (user.role !== 'societyAdmin' && user.role !== 'superadmin')) {
    return <div>Access denied. Your role: {user?.role}</div>;
  }
  let alerts: SOSAlert[] = [];
  let error: string | null = null;
  try {
    alerts = await getSOSAlerts(user.societyId);
  } catch (e: any) {
    error = e?.message || String(e);
  }
  return (
    <section className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-red-100 p-3 shadow">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="#dc2626" strokeWidth="2" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-red-700 leading-tight">SOS Alerts</h1>
          <div className="text-xs text-muted-foreground mt-1">Logged in as: <b>{user.name}</b> ({user.role})</div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-red-600">Recent Alerts</h2>
        {error && <div className="text-red-600 mb-4">Error loading alerts: {error}</div>}
        <SOSAlertsList alerts={alerts} />
      </div>
    </section>
  );
}
