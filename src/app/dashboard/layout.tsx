
'use client';

import React, { useEffect, useMemo } from 'react'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar, NavItem } from '@/components/layout/AppSidebar'; 
import { USER_ROLES } from '@/lib/constants';
import { LayoutDashboard, UserPlus, FileText, Users, LogOut, LucideIcon, ClipboardList } from 'lucide-react'; // Added ClipboardList
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';


const getNavItems = (isAdminUser: boolean, isResidentUser: boolean): NavItem[] => [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/add-visitor', label: 'Add Visitor', icon: UserPlus },
  { href: '/dashboard/visitor-log', label: 'Visitor Log', icon: ClipboardList }, // Added Visitor Log
  ...(isResidentUser ? [{ href: '/dashboard/personal-logs', label: 'My Visitor Logs', icon: FileText } as NavItem] : []),
  ...(isAdminUser ? [{ href: '/dashboard/admin-approvals', label: 'Resident Approvals', icon: Users } as NavItem] : []),
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, isAdmin, isResident } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const navItemsForHeader = useMemo(() => getNavItems(isAdmin(), isResident()), [isAdmin, isResident, user?.role]);


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
