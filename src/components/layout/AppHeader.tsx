'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-provider';
import { APP_NAME } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, Menu, ShieldCheck, UserCircle, Building2, Briefcase, Shield, Clock, Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react'; // Added Briefcase, Shield, Clock, and notification icons
import Link from 'next/link';
import type { NavItem } from './AppSidebar';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { ToastAction } from '@/components/ui/toast';
import { useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AppHeaderProps {
  navItems: NavItem[];
}

export function AppHeader({ navItems }: AppHeaderProps) {
  const { user, logout, societyInfo, sessionTimeLeft } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { toast } = useToast();
  const router = useRouter();
  const currentAppName = societyInfo?.societyName && societyInfo.societyName.trim() !== '' ? societyInfo.societyName : APP_NAME;

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  // Helper to format seconds as mm:ss
  function formatSessionTimeLeft(seconds: number | null) {
    if (seconds === null || seconds < 0) return 'Session expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Helper to format time ago
  function timeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  // Optionally, group notifications by read/unread
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);
  const readNotifications = useMemo(() => notifications.filter(n => n.read), [notifications]);

  // Helper to get icon by type (if type exists)
  function getNotificationIcon(type?: string) {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500 mr-2" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500 mr-2" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground mr-2" />;
    }
  }

  // Toast for new notifications
  const lastNotificationIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (!latest.read && lastNotificationIdRef.current !== latest.id) {
      toast({
        title: latest.title,
        description: latest.message,
        variant: 'default',
        action: latest.link ? (
          <ToastAction altText="View" onClick={() => {
            markAsRead(latest.id);
            router.push(latest.link!);
          }}>
            View
          </ToastAction>
        ) : undefined
      });
      lastNotificationIdRef.current = latest.id;
    }
  }, [notifications, toast, markAsRead, router]);

  // Real-time notification WebSocket
  useEffect(() => {
    // Use the backend WebSocket server for notifications
    const ws = new WebSocket('ws://localhost:4001');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          // Refetch notifications instead of reloading the page
          if (typeof window !== 'undefined' && typeof window.__notificationRefetch === 'function') {
            window.__notificationRefetch();
          } else {
            window.location.reload();
          }
        }
      } catch {
        // fallback
        window.location.reload();
      }
    };
    ws.onerror = () => {
      ws.close();
    };
    return () => ws.close();
  }, []);

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

      {/* Session Timer - always visible, right of header but left of user icon */}
      {user && (
        <div className="flex items-center mr-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Session expires in:</span>
          <Clock className="h-5 w-5 mr-1" />
          {sessionTimeLeft === null || sessionTimeLeft < 0 ? (
            <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700 border border-red-300 animate-pulse">
              Session expired
            </span>
          ) : (
            <span className={
              cn(
                "text-xs font-semibold px-2 py-1 rounded border",
                sessionTimeLeft < 60
                  ? "bg-red-100 text-red-700 border-red-300 animate-pulse"
                  : sessionTimeLeft < 300
                  ? "bg-orange-100 text-orange-700 border-orange-300"
                  : "bg-green-100 text-green-700 border-green-300"
              )
            }>
              {formatSessionTimeLeft(sessionTimeLeft)}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 flex items-center gap-4">
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
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer py-2">
                <LogOut className="mr-3 h-5 w-5 text-red-500" />
                <span className="text-red-500 font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 animate-pulse border border-white">{unreadCount}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto p-0">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <DropdownMenuLabel className="p-0 m-0 font-semibold">Notifications</DropdownMenuLabel>
                {unreadNotifications.length > 0 && (
                  <button
                    className="text-xs text-primary hover:underline focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      unreadNotifications.forEach(n => markAsRead(n.id));
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-muted-foreground text-center text-sm">No notifications</div>
              ) : (
                <div className="divide-y divide-muted-foreground/10">
                  {notifications.slice(0, 10).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) {
                          router.push(n.link);
                        }
                      }}
                      className={
                        cn(
                          'flex items-start gap-2 px-4 py-3 transition-colors cursor-pointer',
                          !n.read ? 'bg-blue-50/80 hover:bg-blue-100 font-semibold' : 'hover:bg-muted',
                          n.link ? 'hover:underline' : '',
                          'group'
                        )
                      }
                    >
                      {getNotificationIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm leading-tight mb-0.5">{n.title}</div>
                        <div className="truncate text-xs text-muted-foreground leading-tight">{n.message}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</div>
                      </div>
                      {!n.read && <span className="ml-2 mt-1 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />}
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              {notifications.length > 10 && (
                <div className="px-4 py-2 text-center">
                  <Link href="/dashboard/notifications" className="text-xs text-primary hover:underline">View all notifications</Link>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
