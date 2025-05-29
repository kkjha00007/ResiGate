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
  Building,
  Sparkles,
  ShieldAlert,
  Briefcase, // Added for Manage Societies
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
  isUserTypeCheck?: (user: UserProfile | null, isAdminFn: () => boolean, isSocietyAdminFn: () => boolean, isOwnerOrRenterFn: () => boolean, isGuardFn: () => boolean) => boolean;
  disabled?: boolean;
  iconColor?: string;
}

const checkVisibility = (
  user: UserProfile | null,
  isAdminFn: () => boolean,
  isSocietyAdminFn: () => boolean,
  isOwnerOrRenterFn: () => boolean,
  isGuardFn: () => boolean,
  item: NavItem
): boolean => {
  if (item.isUserTypeCheck) {
    return item.isUserTypeCheck(user, isAdminFn, isSocietyAdminFn, isOwnerOrRenterFn, isGuardFn);
  }
  // Fallback or default logic if isUserTypeCheck is not defined,
  // though we should aim to use isUserTypeCheck for all role-based visibility.
  if (item.role) {
    return item.role.some(role => {
      if (role === USER_ROLES.SUPERADMIN) return isAdminFn();
      if (role === USER_ROLES.SOCIETY_ADMIN) return isSocietyAdminFn();
      if (role === USER_ROLES.OWNER || role === USER_ROLES.RENTER) return isOwnerOrRenterFn();
      if (role === USER_ROLES.GUARD) return isGuardFn();
      return user?.role === role;
    });
  }
  if (item.hideForRole && user) {
    return !item.hideForRole.includes(user.role);
  }
  return true; // Default to visible if no specific role checks
};


export const getNavItems = (
  user: UserProfile | null,
  isAdminFn: () => boolean,
  isSocietyAdminFn: () => boolean,
  isOwnerOrRenterFn: () => boolean,
  isGuardFn: () => boolean
): NavItem[] => {
  const allItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, iconColor: 'text-sky-500' },
    {
      href: '/dashboard/add-visitor',
      label: 'Add Visitor Entry',
      icon: UserPlus,
      iconColor: 'text-emerald-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iG() || iSA() // Guard or SocietyAdmin
    },
    {
      href: '/dashboard/gate-pass/validate',
      label: 'Validate Gate Pass',
      icon: ShieldCheckIcon,
      iconColor: 'text-blue-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iG() || iSA() // Guard or SocietyAdmin
    },
    {
      href: '/dashboard/visitor-log',
      label: 'Visitor Log',
      icon: ClipboardList,
      iconColor: 'text-amber-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() || iG() // SuperAdmin, SocietyAdmin, or Guard
    },
    {
      href: '/dashboard/gate-pass/create',
      label: 'Create Gate Pass',
      icon: CalendarPlus,
      iconColor: 'text-violet-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() || iSA() || iA() // Owner/Renter, SocietyAdmin or SuperAdmin
    },
    {
      href: '/dashboard/gate-pass/my-passes',
      label: 'My Gate Passes',
      icon: Ticket,
      iconColor: 'text-rose-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() || iSA() || iA() // Owner/Renter, SocietyAdmin or SuperAdmin
    },
    {
      href: '/dashboard/personal-logs',
      label: 'My Visitor Logs',
      icon: FileText,
      iconColor: 'text-teal-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() // Owner/Renter only
    },
    {
      href: '/dashboard/complaints',
      label: 'My Complaints',
      icon: Megaphone,
      iconColor: 'text-orange-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() // Owner/Renter only
    },
     {
      href: '/dashboard/my-parking',
      label: 'My Parking',
      icon: ParkingCircle,
      iconColor: 'text-indigo-400',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() // Owner/Renter only
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
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() || iA() || iSA() // Owner/Renter, SuperAdmin or SocietyAdmin
    },
    {
      href: '/dashboard/facilities',
      label: 'Facilities',
      icon: Sparkles,
      iconColor: 'text-yellow-400',
    },
    // Admin Specific Links (SuperAdmin or SocietyAdmin)
    {
      href: '/dashboard/admin-approvals',
      label: 'User Account Approvals',
      icon: UsersRound, // Changed icon
      iconColor: 'text-pink-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA()
    },
    {
      href: '/dashboard/admin/manage-notices',
      label: 'Manage Notices',
      icon: ClipboardEdit,
      iconColor: 'text-indigo-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA()
    },
    {
      href: '/dashboard/admin/manage-meetings',
      label: 'Manage Meetings',
      icon: UsersRound,
      iconColor: 'text-lime-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA()
    },
    {
      href: '/dashboard/admin/manage-facilities',
      label: 'Manage Facilities',
      icon: Building,
      iconColor: 'text-teal-600',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA()
    },
    {
      href: '/dashboard/admin/manage-vendors',
      label: 'Manage Vendors',
      icon: ListFilter,
      iconColor: 'text-yellow-500',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA()
    },
    {
      href: '/dashboard/admin/manage-parking',
      label: 'Manage Parking',
      icon: ParkingSquare,
      iconColor: 'text-orange-600',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA()
    },
     // SuperAdmin ONLY links
    {
      href: '/dashboard/admin/manage-societies',
      label: 'Manage Societies',
      icon: Briefcase,
      iconColor: 'text-gray-400',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() // SuperAdmin only
    },
    {
      href: '/dashboard/admin/society-settings',
      label: 'Society Settings', // Can be managed by SocietyAdmin too for their specific society
      icon: Building2,
      iconColor: 'text-rose-400',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA()
    },
    {
      href: '/dashboard/admin/audit-logs',
      label: 'Audit Logs',
      icon: ShieldAlert,
      iconColor: 'text-yellow-600',
      isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() // SuperAdmin only
    },
    { href: '/dashboard/my-profile', label: 'My Profile', icon: Settings2, iconColor: 'text-slate-400' }, // Slate color for general settings
  ];
  return allItems.filter(item => checkVisibility(user, isAdminFn, isSocietyAdminFn, isOwnerOrRenterFn, isGuardFn, item));
};


export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard, societyInfo } = useAuth();
  const currentAppName = societyInfo?.societyName && societyInfo.societyName.trim() !== '' ? societyInfo.societyName : APP_NAME;


  const navItems = React.useMemo(() => getNavItems(user, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard), [user, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard]);

  const logoutTooltipProps = React.useMemo(() => ({
    children: "Logout",
    className: "ml-2"
  }), []);

  // DEBUG: Log user and role for troubleshooting sidebar visibility
  console.log('[AppSidebar] user:', user);
  if (user) console.log('[AppSidebar] user.role:', user.role);

  if (!user) return null;

  return (
      <Sidebar collapsible="icon" className="hidden border-r bg-sidebar text-sidebar-foreground shadow-sm md:flex">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <ShieldCheckIcon className="h-7 w-7 text-sidebar-primary" />
            <span className="text-xl font-semibold text-sidebar-primary group-data-[collapsible=icon]:hidden">{currentAppName}</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href.split('/').length >= 3);
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
