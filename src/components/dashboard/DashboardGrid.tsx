// src/components/dashboard/DashboardGrid.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Ticket,
  ClipboardList,
  UsersRound,
  FileText,
  ParkingSquare,
  Building2,
  ConciergeBell,
  ShieldCheckIcon,
  ClipboardEdit,
  Store,
  Briefcase,
  Grid,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';

const gridItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, color: 'bg-sky-200 text-sky-700 hover:bg-sky-400 hover:text-white' },
  { href: '/dashboard/my-profile', label: 'My Profile', icon: Users, color: 'bg-gray-200 text-gray-700 hover:bg-gray-500 hover:text-white' },
  { href: '/dashboard/gate-pass/my-passes', label: 'My Gate Passes', icon: Ticket, color: 'bg-pink-200 text-pink-700 hover:bg-pink-500 hover:text-white' },
  { href: '/dashboard/help', label: 'HelpDesk', icon: ClipboardList, color: 'bg-red-200 text-red-700 hover:bg-red-500 hover:text-white' },
  { href: '/dashboard/neighbours', label: 'Neighbours', icon: UsersRound, color: 'bg-cyan-200 text-cyan-700 hover:bg-cyan-500 hover:text-white' },
  { href: '/dashboard/visitor-log', label: 'Visitor Log', icon: FileText, color: 'bg-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white' },
  { href: '/dashboard/my-parking', label: 'My Parking', icon: ParkingSquare, color: 'bg-indigo-200 text-indigo-700 hover:bg-indigo-500 hover:text-white' },
  { href: '/dashboard/payment-details', label: 'Payments', icon: Building2, color: 'bg-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-500 hover:text-white' },
  { href: '/dashboard/facilities', label: 'Facilities', icon: Building2, color: 'bg-blue-200 text-blue-700 hover:bg-blue-500 hover:text-white' },
  { href: '/dashboard/vendors/directory', label: 'Vendors', icon: ConciergeBell, color: 'bg-purple-200 text-purple-700 hover:bg-purple-500 hover:text-white' },
  { href: '/dashboard/committee-members', label: 'Committee', icon: UsersRound, color: 'bg-lime-200 text-lime-700 hover:bg-lime-500 hover:text-white' },
  { href: '/dashboard/admin-approvals', label: 'Approvals', icon: ShieldCheckIcon, color: 'bg-blue-100 text-blue-700 hover:bg-blue-400 hover:text-white' },
  { href: '/dashboard/admin/society-settings', label: 'Society Settings', icon: Building2, color: 'bg-rose-200 text-rose-700 hover:bg-rose-500 hover:text-white' },
  { href: '/dashboard/admin/manage-societies', label: 'Manage Societies', icon: Briefcase, color: 'bg-gray-200 text-gray-700 hover:bg-gray-700 hover:text-white' },
  { href: '/dashboard/admin/manage-notices', label: 'Manage Notices', icon: ClipboardEdit, color: 'bg-indigo-200 text-indigo-700 hover:bg-indigo-700 hover:text-white' },
  { href: '/dashboard/admin/manage-meetings', label: 'Manage Meetings', icon: UsersRound, color: 'bg-lime-200 text-lime-700 hover:bg-lime-600 hover:text-white' },
  { href: '/dashboard/admin/manage-facilities', label: 'Manage Facilities', icon: Building2, color: 'bg-teal-200 text-teal-700 hover:bg-teal-500 hover:text-white' },
  { href: '/dashboard/admin/manage-vendors', label: 'Manage Vendors', icon: Store, color: 'bg-cyan-200 text-cyan-700 hover:bg-cyan-600 hover:text-white' },
  { href: '/dashboard/admin/manage-parking', label: 'Manage Parking', icon: ParkingSquare, color: 'bg-orange-200 text-orange-700 hover:bg-orange-500 hover:text-white' },
  { href: '/dashboard/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheckIcon, color: 'bg-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white' },
  { href: '/dashboard/admin/manage-personas', label: 'Personas', icon: Building2, color: 'bg-indigo-200 text-indigo-700 hover:bg-indigo-900 hover:text-white' },
  { href: '/dashboard/gate-pass/create', label: 'Create Gate Pass', icon: Ticket, color: 'bg-green-200 text-green-700 hover:bg-green-500 hover:text-white' },
  { href: '/dashboard/feedback', label: 'Feedback / Bug Report', icon: ClipboardEdit, color: 'bg-blue-200 text-blue-700 hover:bg-blue-500 hover:text-white', showForSuperAdmin: false },
  { href: '/dashboard/admin/feedback', label: 'Feedback / Bug Reports', icon: ClipboardEdit, color: 'bg-yellow-200 text-yellow-700 hover:bg-yellow-500 hover:text-white', showForSuperAdmin: true },
  { href: '/dashboard/my-approvals', label: 'My Approvals', icon: Grid, color: 'bg-green-200 text-green-700 hover:bg-green-500 hover:text-white', showForOwnerRenter: true },
  { href: '/dashboard/admin/sos-alerts', label: 'SOS Alerts', icon: Grid, color: 'bg-red-200 text-red-700 hover:bg-red-500 hover:text-white', showForAdmin: true },
  { href: '/dashboard/admin/help', label: 'Manage HelpDesk', icon: ClipboardList, color: 'bg-blue-200 text-blue-700 hover:bg-blue-500 hover:text-white', showForAdmin: true },
];

export function DashboardGrid() {
  const { user, isAdmin, isSocietyAdmin, isOwnerOrRenter } = useAuth();
  // Only show admin grid items for SuperAdmin or SocietyAdmin
  let filteredGridItems = gridItems.filter(item => {
    if (item.href === '/dashboard') return false; // Remove Home button from grid
    const isAdminRoute = item.href.startsWith('/dashboard/admin/');
    // Restrict 'Audit Logs', 'Manage Societies', 'Personas' to SuperAdmin only
    if (
      item.href === '/dashboard/admin/audit-logs' ||
      item.href === '/dashboard/admin/manage-societies' ||
      item.href === '/dashboard/admin/manage-personas'
    ) {
      return isAdmin && isAdmin();
    }
    if (isAdminRoute && !(isAdmin && isAdmin() || isSocietyAdmin && isSocietyAdmin())) {
      return false;
    }
    if (item.href === '/dashboard/admin-approvals') {
      // Only show admin-approvals for admins
      return isAdmin && isAdmin() || isSocietyAdmin && isSocietyAdmin();
    }
    if (item.href === '/dashboard/my-approvals') {
      // Only show my-approvals for owner/renter
      return isOwnerOrRenter && isOwnerOrRenter();
    }
    if (item.href === '/dashboard/feedback') {
      return user && user.role !== 'superadmin';
    }
    if (item.href === '/dashboard/admin/feedback') {
      return user && user.role === 'superadmin';
    }
    if (item.href === '/dashboard/admin/sos-alerts') {
      return (isAdmin && isAdmin()) || (isSocietyAdmin && isSocietyAdmin());
    }
    return true;
  });
  // Sort grid items alphabetically by label for consistency with sidebar
  filteredGridItems = filteredGridItems.sort((a, b) => a.label.localeCompare(b.label));
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-8 py-10 justify-center">
      {filteredGridItems.map(({ href, label, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-col items-center justify-center p-6 rounded-full shadow group border border-[#42A5F5] bg-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#42C8A4] focus:ring-offset-2 text-base ${color}`}
          style={{ minHeight: 96, minWidth: 96, maxWidth: 110 }}
        >
          <Icon className="h-9 w-9 mb-2 transition-colors" />
          <span className="text-sm font-semibold text-center" style={{fontFamily: 'inherit'}}>{label}</span>
        </Link>
      ))}
    </div>
  );
}
