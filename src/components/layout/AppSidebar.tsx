
'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-provider';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import type { UserProfile, UserRole } from '@/lib/types'; 
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
  UsersRound,
  Store,
  ConciergeBell,
  ListFilter,
  Landmark,
  Users2 as NeighboursIcon,
  ParkingSquare,
  ParkingCircle,
  Building2,
  Building, // Added Building icon
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
  isUserTypeCheck?: (user: UserProfile | null) => boolean;
  disabled?: boolean;
  iconColor?: string;
}

const checkVisibility = (user: UserProfile | null, isAdminFn: () => boolean, isOwnerOrRenterFn: () => boolean, isGuardFn: () => boolean, item: NavItem): boolean => {
  if (item.isUserTypeCheck) {
    return item.isUserTypeCheck(user);
  }
  if (item.role) {
    return item.role.some(role => {
      if (role === USER_ROLES.SUPERADMIN) return isAdminFn();
      if (role === USER_ROLES.OWNER || role === USER_ROLES.RENTER) return isOwnerOrRenterFn();
      if (role === USER_ROLES.GUARD) return isGuardFn();
      return user?.role === role;
    });
  }
  if (item.hideForRole && user) {
    return !item.hideForRole.includes(user.role);
  }
  return true;
};


export const getNavItems = (user: UserProfile | null, isAdminFn: () => boolean, isOwnerOrRenterFn: () => boolean, isGuardFn: () => boolean): NavItem[] => {
  const allItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, iconColor: 'text-sky-500' },
    {
      href: '/dashboard/add-visitor',
      label: 'Add Visitor Entry',
      icon: UserPlus,
      iconColor: 'text-emerald-500',
      isUserTypeCheck: (u) => isGuardFn()
    },
    {
      href: '/dashboard/gate-pass/validate',
      label: 'Validate Gate Pass',
      icon: ShieldCheckIcon,
      iconColor: 'text-blue-500',
      isUserTypeCheck: (u) => isGuardFn()
    },
    {
      href: '/dashboard/visitor-log',
      label: 'Visitor Log',
      icon: ClipboardList,
      iconColor: 'text-amber-500',
      isUserTypeCheck: (u) => isAdminFn() || isGuardFn()
    },
    {
      href: '/dashboard/gate-pass/create',
      label: 'Create Gate Pass',
      icon: CalendarPlus,
      iconColor: 'text-violet-500',
      isUserTypeCheck: (u) => isOwnerOrRenterFn() || isAdminFn()
    },
    {
      href: '/dashboard/gate-pass/my-passes',
      label: 'My Gate Passes',
      icon: Ticket,
      iconColor: 'text-rose-500',
      isUserTypeCheck: (u) => isOwnerOrRenterFn() || isAdminFn()
    },
    {
      href: '/dashboard/personal-logs',
      label: 'My Visitor Logs',
      icon: FileText,
      iconColor: 'text-teal-500',
      isUserTypeCheck: (u) => isOwnerOrRenterFn()
    },
    {
      href: '/dashboard/complaints',
      label: 'My Complaints',
      icon: Megaphone,
      iconColor: 'text-orange-500',
      isUserTypeCheck: (u) => isOwnerOrRenterFn()
    },
     {
      href: '/dashboard/my-parking',
      label: 'My Parking',
      icon: ParkingCircle,
      iconColor: 'text-indigo-400',
      isUserTypeCheck: (u) => isOwnerOrRenterFn()
    },
    { href: '/dashboard/neighbours', label: 'Our Neighbours', icon: NeighboursIcon, iconColor: 'text-cyan-600' },
    { href: '/dashboard/vendors/directory', label: 'Vendor Directory', icon: Store, iconColor: 'text-cyan-500' },
    { href: '/dashboard/vendors/add', label: 'Add Vendor', icon: ConciergeBell, iconColor: 'text-purple-500' },
    { href: '/dashboard/committee-members', label: 'Committee Members', icon: Users, iconColor: 'text-green-500' },
    {
      href: '/dashboard/payment-details',
      label: 'Payment Details',
      icon: Landmark,
      iconColor: 'text-fuchsia-500',
      isUserTypeCheck: (u) => isOwnerOrRenterFn() || isAdminFn()
    },
    // Admin Specific Links
    {
      href: '/dashboard/admin-approvals',
      label: 'User Account Approvals',
      icon: Users,
      iconColor: 'text-pink-500',
      isUserTypeCheck: (u) => isAdminFn()
    },
    {
      href: '/dashboard/admin/manage-notices',
      label: 'Manage Notices',
      icon: ClipboardEdit,
      iconColor: 'text-indigo-500',
      isUserTypeCheck: (u) => isAdminFn()
    },
    {
      href: '/dashboard/admin/manage-meetings',
      label: 'Manage Meetings',
      icon: UsersRound,
      iconColor: 'text-lime-500',
      isUserTypeCheck: (u) => isAdminFn()
    },
    {
      href: '/dashboard/admin/manage-facilities',
      label: 'Manage Facilities',
      icon: Building,
      iconColor: 'text-teal-600',
      isUserTypeCheck: (u) => isAdminFn()
    },
    {
      href: '/dashboard/admin/manage-vendors',
      label: 'Manage Vendors',
      icon: ListFilter,
      iconColor: 'text-yellow-500',
      isUserTypeCheck: (u) => isAdminFn()
    },
    {
      href: '/dashboard/admin/manage-parking',
      label: 'Manage Parking',
      icon: ParkingSquare,
      iconColor: 'text-orange-600',
      isUserTypeCheck: (u) => isAdminFn()
    },
    {
      href: '/dashboard/admin/society-settings',
      label: 'Society Settings',
      icon: Building2,
      iconColor: 'text-rose-400',
      isUserTypeCheck: (u) => isAdminFn()
    },
    { href: '/dashboard/my-profile', label: 'My Profile', icon: Settings2, iconColor: 'text-gray-400' },
  ];
  return allItems.filter(item => checkVisibility(user, isAdminFn, isOwnerOrRenterFn, isGuardFn, item));
};


export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isOwnerOrRenter, isGuard, societyInfo } = useAuth();
  const currentAppName = societyInfo?.societyName && societyInfo.societyName.trim() !== '' ? societyInfo.societyName : APP_NAME;


  const navItems = React.useMemo(() => getNavItems(user, isAdmin, isOwnerOrRenter, isGuard), [user, isAdmin, isOwnerOrRenter, isGuard]);

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
            <span className="text-xl font-semibold text-sidebar-primary group-data-[collapsible=icon]:hidden">{currentAppName}</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href.split('/').length > 2);
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
                      <item.icon className={cn("h-5 w-5", item.iconColor || 'text-sidebar-primary')} />
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
              className="justify-start group"
              onClick={logout}
            >
              <LogOut className="h-5 w-5 text-red-500" />
              <span className="group-data-[collapsible=icon]:hidden group-hover:font-semibold">Logout</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
  );
}
