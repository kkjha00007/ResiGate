'use client';

import { RightPanel } from './RightPanel';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

export default function DashboardPage() {
  return (
    <div className="space-y-6 flex flex-col lg:flex-row">
      {/* Center panel: remove Announcements, Meetings, Contacts cards */}
      <div className="flex-1 flex items-center justify-center">
        <DashboardGrid />
      </div>
      {/* Right panel only on main dashboard page */}
      <div className="hidden lg:block w-80 min-w-[260px] max-w-xs">
        <RightPanel />
      </div>
    </div>
  );
}
