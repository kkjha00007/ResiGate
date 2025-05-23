
'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar, NavItem } from '@/components/layout/AppSidebar';
import { USER_ROLES } from '@/lib/constants';
import { LayoutDashboard, UserPlus, FileText, Users, LogOut, LucideIcon, ClipboardList, CalendarPlus, Ticket, ShieldCheckIcon, Settings2, Megaphone, ClipboardEdit, UsersRound, Store, ConciergeBell, ListFilter } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';


const getNavItemsForLayout = (isAdminUser: boolean, isOwnerOrRenterUser: boolean, isGuardUser: boolean): NavItem[] => [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, iconColor: 'text-sky-500' },

  // Guard Specific
  ...(isGuardUser ? [
    { href: '/dashboard/add-visitor', label: 'Add Visitor Entry', icon: UserPlus, iconColor: 'text-emerald-500' } as NavItem,
    { href: '/dashboard/gate-pass/validate', label: 'Validate Gate Pass', icon: ShieldCheckIcon, iconColor: 'text-blue-500' } as NavItem,
  ] : []),

  { href: '/dashboard/visitor-log', label: 'Visitor Log', icon: ClipboardList, iconColor: 'text-amber-500' },

  // Owner/Renter and Admin Specific
  ...((isOwnerOrRenterUser || isAdminUser) ? [
    { href: '/dashboard/gate-pass/create', label: 'Create Gate Pass', icon: CalendarPlus, iconColor: 'text-violet-500' } as NavItem,
    { href: '/dashboard/gate-pass/my-passes', label: 'My Gate Passes', icon: Ticket, iconColor: 'text-rose-500' } as NavItem,
  ] : []),

  // Owner/Renter Specific
  ...(isOwnerOrRenterUser ? [
    { href: '/dashboard/personal-logs', label: 'My Visitor Logs', icon: FileText, iconColor: 'text-teal-500' } as NavItem,
    { href: '/dashboard/complaints', label: 'My Complaints', icon: Megaphone, iconColor: 'text-orange-500' } as NavItem,
  ] : []),

  // Vendor Directory - All authenticated users
  { href: '/dashboard/vendors/directory', label: 'Vendor Directory', icon: Store, iconColor: 'text-cyan-500' },
  { href: '/dashboard/vendors/add', label: 'Add Vendor', icon: ConciergeBell, iconColor: 'text-purple-500' },

  // Committee Members - All authenticated users
  { href: '/dashboard/committee-members', label: 'Committee Members', icon: Users, iconColor: 'text-green-500' },

  // Admin Specific
  ...(isAdminUser ? [
    { href: '/dashboard/admin-approvals', label: 'User Approvals', icon: Users, iconColor: 'text-pink-500' } as NavItem,
    { href: '/dashboard/admin/manage-notices', label: 'Manage Notices', icon: ClipboardEdit, iconColor: 'text-indigo-500' } as NavItem,
    { href: '/dashboard/admin/manage-meetings', label: 'Manage Meetings', icon: UsersRound, iconColor: 'text-lime-500' } as NavItem,
    { href: '/dashboard/admin/manage-vendors', label: 'Manage Vendors', icon: ListFilter, iconColor: 'text-yellow-500' } as NavItem,
  ] : []),
  // All logged-in users
  { href: '/dashboard/my-profile', label: 'My Profile', icon: Settings2, iconColor: 'text-gray-400' },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, isAdmin, isOwnerOrRenter, isGuard } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/'); // Redirect to main login page
    }
  }, [user, isLoading, router]);

  const navItemsForHeader = useMemo(() => getNavItemsForLayout(isAdmin(), isOwnerOrRenter(), isGuard()), [isAdmin, isOwnerOrRenter, isGuard]);


  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader navItems={navItemsForHeader} />
          <main className="flex-1 overflow-y-auto bg-secondary/30 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
