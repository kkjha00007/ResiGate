'use client';

import { RightPanel } from './RightPanel';

export default function DashboardPage() {
  return (
    <div className="space-y-6 flex flex-col lg:flex-row">
      {/* Center panel: remove Announcements, Meetings, Contacts cards */}
      <div className="flex-1">
        {/* You can add a welcome message or dashboard summary here if desired */}
      </div>
      {/* Right panel only on main dashboard page */}
      <div className="hidden lg:block w-80 min-w-[260px] max-w-xs">
        <RightPanel />
      </div>
    </div>
  );
}
