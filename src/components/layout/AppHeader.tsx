
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-provider';
import { APP_NAME } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, Menu, ShieldCheck, UserCircle, Building2, Briefcase, Shield, Clock } from 'lucide-react'; // Added Briefcase, Shield, Clock
import Link from 'next/link';
import type { NavItem } from './AppSidebar';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  navItems: NavItem[];
}

export function AppHeader({ navItems }: AppHeaderProps) {
  const { user, logout, societyInfo } = useAuth();
  const currentAppName = societyInfo?.societyName && societyInfo.societyName.trim() !== '' ? societyInfo.societyName : APP_NAME;

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 shadow-sm">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 pt-4 bg-sidebar text-sidebar-foreground w-[260px]">
            <Link href="/dashboard" className="flex items-center gap-2 px-4 pb-4 border-b border-sidebar-border">
               <ShieldCheck className="h-7 w-7 text-sidebar-primary" />
              <span className="text-xl font-semibold text-sidebar-primary">{currentAppName}</span>
            </Link>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <item.icon className={cn("h-4 w-4", item.iconColor || 'text-sidebar-primary')} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:flex items-center gap-2">
         <ShieldCheck className="h-7 w-7 text-primary" />
        <span className="text-xl font-semibold text-primary">{currentAppName}</span>
      </div>

      <div className="flex-1">
        {/* Optional: Breadcrumbs or page title can go here */}
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.role === 'superadmin' ? `https://placehold.co/100x100/42A5F5/FFFFFF.png?text=${getInitials(user.name)}` : `https://placehold.co/100x100/42C8A4/FFFFFF.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="user avatar" />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 p-1">
                <p className="text-md font-semibold leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="py-2 px-1 space-y-2">
              <div className="flex items-center px-2 py-1 text-sm text-foreground">
                <UserCircle className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>{user.name}</span>
              </div>
              {user.flatNumber && (
                <div className="flex items-center px-2 py-1 text-sm text-foreground">
                  <Building2 className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span>Flat: {user.flatNumber}</span>
                </div>
              )}
              <div className="flex items-center px-2 py-1 text-sm text-foreground">
                <Briefcase className="mr-3 h-5 w-5 text-muted-foreground" />
                <span className="capitalize">Role: {user.role}</span>
              </div>
              {societyInfo?.societyName && (
                <div className="flex items-center px-2 py-1 text-sm text-foreground">
                  <Shield className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span>Society: {societyInfo.societyName}</span>
                </div>
              )}
              <div className="flex items-center px-2 py-1 text-sm text-foreground">
                <Clock className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>Last Login: Not tracked</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer py-2">
              <LogOut className="mr-3 h-5 w-5 text-red-500" />
              <span className="text-red-500 font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
