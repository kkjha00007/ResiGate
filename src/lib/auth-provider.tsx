
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserProfile, VisitorEntry } from './types'; // UserProfile for client-side
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { USER_ROLES } from './constants';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'isApproved' | 'role' | 'registrationDate'> & {password: string}) => Promise<boolean>;
  approveResident: (userId: string) => Promise<boolean>;
  isAdmin: () => boolean;
  isResident: () => boolean;
  allUsers: UserProfile[];
  fetchAllUsers: () => Promise<void>;
  visitorEntries: VisitorEntry[];
  fetchVisitorEntries: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsersState] = useState<UserProfile[]>([]);
  const [visitorEntries, setVisitorEntriesState] = useState<VisitorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect is for initial auth check (e.g., session restoration).
    // Since we don't have server sessions yet, we just mark loading as complete.
    // A real app would try to load user from a session here.
    setIsLoading(false); 
  }, []);


  const fetchAllUsers = useCallback(async () => {
    // This function fetches all users. Components should manage their own specific loading UI.
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users and could not parse error response.' }));
        throw new Error(errorData.message || 'Server error while fetching users.');
      }
      const usersData: UserProfile[] = await response.json();
      setAllUsersState(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: 'Error Loading Users', description: (error as Error).message, variant: 'destructive' });
    }
  }, [toast]);

  const fetchVisitorEntries = useCallback(async () => {
    // This function fetches visitor entries. Components should manage their own specific loading UI.
    try {
      const response = await fetch('/api/visitors');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch visitor entries and could not parse error response.' }));
        throw new Error(errorData.message || 'Server error while fetching visitor entries.');
      }
      const entriesData: VisitorEntry[] = await response.json();
      setVisitorEntriesState(entriesData);
    } catch (error) {
      console.error("Failed to fetch visitor entries:", error);
      toast({ title: 'Error Loading Visitor Entries', description: (error as Error).message, variant: 'destructive' });
    }
  }, [toast]);


  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true); // Global loading during login process
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Login Failed', description: data.message || 'Invalid credentials.', variant: 'destructive' });
        return false;
      }
      
      const loggedInUser = data as UserProfile;
      if (loggedInUser.role === USER_ROLES.RESIDENT && !loggedInUser.isApproved) {
        toast({ title: 'Login Failed', description: 'Your account is pending approval.', variant: 'destructive' });
        setUser(null); 
        return false;
      }

      setUser(loggedInUser);
      toast({ title: 'Login Successful', description: `Welcome back, ${loggedInUser.name}!` });
      router.push('/dashboard');
      return true;
    } catch (error) {
      toast({ title: 'Login Error', description: 'An unexpected error occurred during login.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    router.push('/login');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'role' | 'registrationDate'> & {password: string}): Promise<boolean> => {
    setIsLoading(true); // Global loading during registration process
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Registration Failed', description: data.message || 'Could not create account.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Registration Successful', description: 'Your account has been created and is pending approval.' });
      router.push('/login');
      return true;
    } catch (error) {
      toast({ title: 'Registration Error', description: 'An unexpected error occurred during registration.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const approveResident = async (userId: string): Promise<boolean> => {
    // Component calling this should handle its own loading state for the specific action
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Approval Failed', description: data.message || 'Could not approve resident.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Resident Approved', description: `${data.name} has been approved.` });
      await fetchAllUsers(); 
      return true;
    } catch (error) {
      toast({ title: 'Approval Error', description: 'An unexpected error occurred during approval.', variant: 'destructive' });
      return false;
    }
  };
  
  const isAdmin = useCallback(() => user?.role === USER_ROLES.SUPERADMIN, [user]);
  const isResident = useCallback(() => user?.role === USER_ROLES.RESIDENT, [user]);

  return (
    <AuthContext.Provider value={{ 
        user, 
        isLoading, 
        login, 
        logout, 
        register, 
        approveResident, 
        isAdmin, 
        isResident, 
        allUsers, 
        fetchAllUsers,
        visitorEntries,
        fetchVisitorEntries
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
