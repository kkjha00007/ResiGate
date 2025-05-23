'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-provider';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserPlus,
  ListChecks,
  ShieldCheck as AdminIcon, // Renamed to avoid conflict
  LogOut,
  Users,
  Settings,
  LucideIcon,
  Home,
  FileText
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar'; // Assuming this is the custom sidebar from components/ui


export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  role?: UserRole; // Optional: restrict item by role
  disabled?: boolean;
}

const getNavItems = (isAdminUser: boolean, isResidentUser: boolean): NavItem[] => [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/add-visitor', label: 'Add Visitor Entry', icon: UserPlus },
  ...(isResidentUser ? [{ href: '/dashboard/personal-logs', label: 'My Visitor Logs', icon: FileText } as NavItem] : []),
  ...(isAdminUser ? [{ href: '/dashboard/admin-approvals', label: 'Resident Approvals', icon: Users } as NavItem] : []),
  // Future items:
  // { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, disabled: true },
  // { href: '/dashboard/settings', label: 'Settings', icon: Settings, role: USER_ROLES.SUPERADMIN, disabled: true },
];


export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isResident } = useAuth();
  
  const navItems = getNavItems(isAdmin(), isResident());

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r shadow-sm">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <AdminIcon className="h-7 w-7 text-sidebar-primary" />
            <span className="text-xl font-semibold text-sidebar-primary group-data-[collapsible=icon]:hidden">{APP_NAME}</span>
          </Link>
        </SidebarHeader>
        
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => {
              if (item.role && user.role !== item.role) return null;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={{children: item.label, className: "ml-2"}}
                    disabled={item.disabled}
                    className={cn(
                      "justify-start",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenuButton
              asChild
              tooltip={{children: "Logout", className: "ml-2"}}
              className="justify-start"
              onClick={logout}
            >
            <div> {/* Using div because Link/Button asChild needs a single child */}
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </div>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
