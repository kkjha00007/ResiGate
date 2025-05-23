
'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-provider';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import type { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  Users,
  FileText,
  LogOut,
  LucideIcon,
  CalendarPlus,
  Ticket,
  ShieldCheckIcon, 
  Settings2, 
  Megaphone,
  ClipboardEdit,
  UsersRound, // For Manage Meetings
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
  role?: UserRole[]; 
  hideForRole?: UserRole[]; 
  disabled?: boolean;
  iconColor?: string;
}

const getNavItems = (isAdminUser: boolean, isOwnerOrRenterUser: boolean, isGuardUser: boolean): NavItem[] => [
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
  
  // Admin Specific
  ...(isAdminUser ? [
    { href: '/dashboard/admin-approvals', label: 'User Approvals', icon: Users, iconColor: 'text-pink-500' } as NavItem,
    { href: '/dashboard/admin/manage-notices', label: 'Manage Notices', icon: ClipboardEdit, iconColor: 'text-indigo-500' } as NavItem,
    { href: '/dashboard/admin/manage-meetings', label: 'Manage Meetings', icon: UsersRound, iconColor: 'text-lime-500' } as NavItem,
  ] : []),

  // All logged-in users
  { href: '/dashboard/my-profile', label: 'My Profile', icon: Settings2, iconColor: 'text-gray-400' },
];


export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isOwnerOrRenter, isGuard } = useAuth();

  const navItems = React.useMemo(() => getNavItems(isAdmin(), isOwnerOrRenter(), isGuard()), [isAdmin, isOwnerOrRenter, isGuard]);

  const logoutTooltipProps = React.useMemo(() => ({
    children: "Logout",
    className: "ml-2"
  }), []);

  if (!user) return null;

  return (
      <Sidebar collapsible="icon" className="hidden border-r bg-sidebar text-sidebar-foreground shadow-sm md:flex">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--sidebar-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
            <span className="text-xl font-semibold text-sidebar-primary group-data-[collapsible=icon]:hidden">{APP_NAME}</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => {
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
                    className="justify-start group" 
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-5 w-5", item.iconColor || 'text-sidebar-foreground')} />
                      <span className="group-data-[collapsible=icon]:hidden group-hover:font-semibold">{item.label}</span>
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
              className="justify-start group"
              onClick={logout}
            >
            <div>
              <LogOut className="h-5 w-5 text-red-500" />
              <span className="group-data-[collapsible=icon]:hidden group-hover:font-semibold">Logout</span>
            </div>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
  );
}
