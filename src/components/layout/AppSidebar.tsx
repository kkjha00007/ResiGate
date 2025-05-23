
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-provider';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  Users,
  FileText,
  LogOut,
  LucideIcon,
  CalendarPlus, // Icon for Create Gate Pass
  Ticket, // Icon for My Gate Passes
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';


export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  role?: UserRole[]; // Can be an array of roles or undefined for all
  disabled?: boolean;
}

const getNavItems = (isAdminUser: boolean, isResidentUser: boolean, isGuardUser: boolean): NavItem[] => [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  // Show "Add Visitor Entry" only for Guard role (or if no specific roles are implemented yet, this might mean it's hidden by default for admin/resident)
  ...(isGuardUser ? [{ href: '/dashboard/add-visitor', label: 'Add Visitor Entry', icon: UserPlus } as NavItem] : []),
  { href: '/dashboard/visitor-log', label: 'Visitor Log', icon: ClipboardList },
  // Gate Pass links for Resident and Superadmin
  ...((isResidentUser || isAdminUser) ? [
    { href: '/dashboard/gate-pass/create', label: 'Create Gate Pass', icon: CalendarPlus } as NavItem,
    { href: '/dashboard/gate-pass/my-passes', label: 'My Gate Passes', icon: Ticket } as NavItem,
  ] : []),
  ...(isResidentUser ? [{ href: '/dashboard/personal-logs', label: 'My Visitor Logs', icon: FileText } as NavItem] : []),
  ...(isAdminUser ? [{ href: '/dashboard/admin-approvals', label: 'Resident Approvals', icon: Users } as NavItem] : []),
];


export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isResident, isGuard } = useAuth();

  const navItems = React.useMemo(() => getNavItems(isAdmin(), isResident(), isGuard()), [isAdmin, isResident, isGuard, user?.role]);


  const logoutTooltipProps = React.useMemo(() => ({
    children: "Logout",
    className: "ml-2"
  }), []);

  if (!user) return null;

  return (
      <Sidebar collapsible="icon" className="border-r shadow-sm hidden md:flex">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check text-sidebar-primary"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
            <span className="text-xl font-semibold text-sidebar-primary group-data-[collapsible=icon]:hidden">{APP_NAME}</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => {
              const showItem = !item.role || (user?.role && item.role.includes(user.role));
              if (!showItem) return null;

              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              const tooltipProps = React.useMemo(() => ({
                children: item.label,
                className: "ml-2"
              }), [item.label]);

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={tooltipProps}
                    disabled={item.disabled}
                    className="justify-start"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5 text-sidebar-primary" />
                      <span className="group-data-[collapsible=icon]:hidden group-hover/menu-item:font-semibold">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenuButton
              tooltip={logoutTooltipProps}
              className="justify-start group" // Added group here
              onClick={logout}
            >
            <div>
              <LogOut className="h-5 w-5 text-sidebar-primary" />
              <span className="group-data-[collapsible=icon]:hidden group-hover:font-semibold">Logout</span>
            </div>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
  );
}
