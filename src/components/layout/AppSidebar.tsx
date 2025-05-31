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
    // 1. General/All Users
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, iconColor: 'text-sky-500' },
    { href: '/dashboard/my-profile', label: 'My Profile', icon: Settings2, iconColor: 'text-slate-400' },

    // 2. Add Visitor Entry (Owner/Renter, Guard, SocietyAdmin)
    { href: '/dashboard/add-visitor', label: 'Add Visitor Entry', icon: UserPlus, iconColor: 'text-emerald-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() || iG() || iSA() },

    // 3. Visitor Log (SuperAdmin, SocietyAdmin, Guard)
    { href: '/dashboard/visitor-log', label: 'Visitor Log', icon: ClipboardList, iconColor: 'text-amber-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() || iG() },

    // 4. Validate Gate Pass (Guard, SocietyAdmin)
    { href: '/dashboard/gate-pass/validate', label: 'Validate Gate Pass', icon: ShieldCheckIcon, iconColor: 'text-blue-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iG() || iSA() },

    // 5. Gate Passes
    { href: '/dashboard/gate-pass/create', label: 'Create Gate Pass', icon: CalendarPlus, iconColor: 'text-violet-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() || iSA() || iA() },
    { href: '/dashboard/gate-pass/my-passes', label: 'My Gate Passes', icon: Ticket, iconColor: 'text-rose-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() || iSA() || iA() },

    // 6. Owner/Renter
    { href: '/dashboard/personal-logs', label: 'My Visitor Logs', icon: FileText, iconColor: 'text-teal-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() },
    { href: '/dashboard/complaints', label: 'My Complaints', icon: Megaphone, iconColor: 'text-orange-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() },
    { href: '/dashboard/my-parking', label: 'My Parking', icon: ParkingCircle, iconColor: 'text-indigo-400', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() },
    { href: '/dashboard/payment-details', label: 'Payment Details', icon: Landmark, iconColor: 'text-fuchsia-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iOR() || iA() || iSA() },
    { href: '/dashboard/facilities', label: 'Facilities', icon: Sparkles, iconColor: 'text-yellow-400' },
    { href: '/dashboard/neighbours', label: 'Our Neighbours', icon: NeighboursIcon, iconColor: 'text-cyan-600' },
    { href: '/dashboard/vendors/directory', label: 'Vendor Directory', icon: Store, iconColor: 'text-cyan-500' },
    { href: '/dashboard/vendors/add', label: 'Add Vendor', icon: ConciergeBell, iconColor: 'text-purple-500' },
    { href: '/dashboard/committee-members', label: 'Committee Members', icon: Users, iconColor: 'text-green-500' },

    // 7. Admin/Management (SuperAdmin, SocietyAdmin)
    { href: '/dashboard/admin-approvals', label: 'User Account Approvals', icon: UsersRound, iconColor: 'text-pink-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() },
    { href: '/dashboard/admin/complaints', label: 'Complaints (All)', icon: Megaphone, iconColor: 'text-orange-700', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() },
    { href: '/dashboard/admin/manage-notices', label: 'Manage Notices', icon: ClipboardEdit, iconColor: 'text-indigo-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() },
    { href: '/dashboard/admin/manage-meetings', label: 'Manage Meetings', icon: UsersRound, iconColor: 'text-lime-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() },
    { href: '/dashboard/admin/manage-facilities', label: 'Manage Facilities', icon: Building, iconColor: 'text-teal-600', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() },
    { href: '/dashboard/admin/manage-vendors', label: 'Manage Vendors', icon: ListFilter, iconColor: 'text-yellow-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() },
    { href: '/dashboard/admin/manage-parking', label: 'Manage Parking', icon: ParkingSquare, iconColor: 'text-orange-600', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() },
    { href: '/dashboard/admin/society-settings', label: 'Society Settings', icon: Building2, iconColor: 'text-rose-400', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() || iSA() },

    // 8. SuperAdmin Only
    { href: '/dashboard/admin/manage-societies', label: 'Manage Societies', icon: Briefcase, iconColor: 'text-gray-400', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() },
    { href: '/dashboard/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert, iconColor: 'text-yellow-600', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() },
    { href: '/dashboard/admin/manage-personas', label: 'Manage Personas', icon: Sparkles, iconColor: 'text-indigo-500', isUserTypeCheck: (u, iA, iSA, iOR, iG) => iA() }
  ];
  return allItems.filter(item => checkVisibility(user, isAdminFn, isSocietyAdminFn, isOwnerOrRenterFn, isGuardFn, item));
};

const SidebarNav = () => {
  const pathname = usePathname();
  const { user, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard, logout } = useAuth();
  const items = useMemo(() => getNavItems(user, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard), [user, isAdmin, isSocietyAdmin, isOwnerOrRenter, isGuard]);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href='/' className='flex items-center space-x-2'>
          <h1 className='text-lg font-semibold'>{APP_NAME}</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.href} className={cn('rounded-md', { 'opacity-50 cursor-not-allowed': item.disabled })}>
              <Link href={item.href} className='flex items-center p-2 text-sm font-medium'>
                <item.icon className={cn('mr-3 h-5 w-5', item.iconColor)} />
                <span className='flex-1'>{item.label}</span>
                {pathname === item.href && <span className='text-xs font-semibold text-sky-500'>&nbsp;&gt;</span>}
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className='flex items-center justify-start p-4 text-sm'>
          <button onClick={logout} className='flex items-center text-red-500'>
            <LogOut className='mr-2 h-4 w-4' />
            Logout
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarNav;
export function AppSidebar() {
  return <SidebarNav />;
}
