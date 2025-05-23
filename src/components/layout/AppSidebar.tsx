
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
  ListChecks,
  ShieldCheck as AdminIcon, 
  LogOut,
  Users,
  Settings,
  LucideIcon,
  Home,
  FileText,
  ClipboardList // Added ClipboardList icon
} from 'lucide-react';
import {
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
} from '@/components/ui/sidebar'; 


export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  role?: UserRole; 
  disabled?: boolean;
}

const getNavItems = (isAdminUser: boolean, isResidentUser: boolean): NavItem[] => [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/add-visitor', label: 'Add Visitor Entry', icon: UserPlus },
  { href: '/dashboard/visitor-log', label: 'Visitor Log', icon: ClipboardList }, // Added Visitor Log
  ...(isResidentUser ? [{ href: '/dashboard/personal-logs', label: 'My Visitor Logs', icon: FileText } as NavItem] : []),
  ...(isAdminUser ? [{ href: '/dashboard/admin-approvals', label: 'Resident Approvals', icon: Users } as NavItem] : []),
];


export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isResident } = useAuth();
  
  const navItems = React.useMemo(() => getNavItems(isAdmin(), isResident()), [isAdmin, isResident, user?.role]);


  const logoutTooltipProps = React.useMemo(() => ({
    children: "Logout",
    className: "ml-2"
  }), []);

  if (!user) return null;

  return (
      <Sidebar collapsible="icon" className="border-r shadow-sm hidden md:flex"> 
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
              tooltip={logoutTooltipProps} 
              className="justify-start"
              onClick={logout}
            >
            <div> 
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </div>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
  );
}
