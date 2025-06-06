import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Notification } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/notifications?userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Optionally, poll every 30s for now (replace with real-time later)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    // Expose fetchNotifications globally for real-time refetch
    if (typeof window !== 'undefined') {
      window.__notificationRefetch = fetchNotifications;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__notificationRefetch;
      }
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}

// Add to Window type for notification refetch
declare global {
  interface Window {
    __notificationRefetch?: () => void;
  }
}
