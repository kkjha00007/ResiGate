'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar, getNavItems } from '@/components/layout/AppSidebar';
import { AppFooter } from '@/components/layout/AppFooter';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard, initialDataFetch } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const navItemsForHeader = React.useMemo(() => getNavItems(user, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard), [user, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard]);

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
        {/* Sidebar: overlays content only on mobile, always visible on md+ */}
        <div className="md:hidden">
          {/* Mobile sidebar toggle and overlay logic here if needed */}
        </div>
        <div className="hidden md:block md:static md:w-64 md:min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <AppSidebar />
        </div>
        {/* Center: Route content */}
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader navItems={navItemsForHeader} />
          <main className="flex-1 flex flex-col gap-4 overflow-y-auto bg-secondary/30 p-4 md:p-6 lg:p-8">
            {/* Render children (page content) only */}
            {children}
            {/* Right panel removed from layout; will be rendered only in dashboard/page.tsx */}
          </main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
