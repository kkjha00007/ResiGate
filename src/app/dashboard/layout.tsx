
'use client';

import React, { useEffect, useMemo } from 'react'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar, NavItem } from '@/components/layout/AppSidebar'; 
import { USER_ROLES } from '@/lib/constants';
import { LayoutDashboard, UserPlus, FileText, Users, LogOut, LucideIcon, ClipboardList, CalendarPlus, Ticket, ShieldCheckIcon } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { UserRole } from '@/lib/types';


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
    { href: '/dashboard/personal-logs', label: 'My Visitor Logs', icon: FileText, iconColor: 'text-teal-500' } as NavItem
  ] : []),
  
  // Admin Specific
  ...(isAdminUser ? [
    { href: '/dashboard/admin-approvals', label: 'User Approvals', icon: Users, iconColor: 'text-pink-500' } as NavItem // Changed label
  ] : []),
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
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const navItemsForHeader = useMemo(() => getNavItemsForLayout(isAdmin(), isOwnerOrRenter(), isGuard()), [isAdmin, isOwnerOrRenter, isGuard, user?.role]);


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
