
'use client';

import React, { useEffect, useMemo } from 'react'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar, NavItem } from '@/components/layout/AppSidebar'; 
import { USER_ROLES } from '@/lib/constants';
import { LayoutDashboard, UserPlus, FileText, Users, LogOut, LucideIcon, ClipboardList, CalendarPlus, Ticket } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';


const getNavItemsForLayout = (isAdminUser: boolean, isResidentUser: boolean, isGuardUser: boolean): NavItem[] => [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ...(isGuardUser ? [{ href: '/dashboard/add-visitor', label: 'Add Visitor', icon: UserPlus } as NavItem] : []),
  { href: '/dashboard/visitor-log', label: 'Visitor Log', icon: ClipboardList },
  ...((isResidentUser || isAdminUser) ? [
    { href: '/dashboard/gate-pass/create', label: 'Create Gate Pass', icon: CalendarPlus } as NavItem,
    { href: '/dashboard/gate-pass/my-passes', label: 'My Gate Passes', icon: Ticket } as NavItem,
  ] : []),
  ...(isResidentUser ? [{ href: '/dashboard/personal-logs', label: 'My Visitor Logs', icon: FileText } as NavItem] : []),
  ...(isAdminUser ? [{ href: '/dashboard/admin-approvals', label: 'Resident Approvals', icon: Users } as NavItem] : []),
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, isAdmin, isResident, isGuard } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const navItemsForHeader = useMemo(() => getNavItemsForLayout(isAdmin(), isResident(), isGuard()), [isAdmin, isResident, isGuard, user?.role]);


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
