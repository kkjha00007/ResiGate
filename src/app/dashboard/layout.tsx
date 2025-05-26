
'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserProfile } from '@/lib/auth-provider';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar, getNavItems, type NavItem } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, isAdmin, isOwnerOrRenter, isGuard, initialDataFetch } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
    // AuthProvider now handles its own initialDataFetch trigger based on user state
  }, [user, isLoading, router]);


  const navItemsForHeader = useMemo(() => getNavItems(user, isAdmin, isOwnerOrRenter, isGuard), [user, isAdmin, isOwnerOrRenter, isGuard]);


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
