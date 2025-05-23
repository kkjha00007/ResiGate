
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserProfile, VisitorEntry } from './types'; // UserProfile for client-side
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { USER_ROLES } from './constants';
// import { initializeCosmosDB } from './cosmosdb'; // Initialization is handled in cosmosdb.ts

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
  fetchAllUsers: () => Promise<void>; // Renamed from fetchUsers for clarity
  visitorEntries: VisitorEntry[];
  fetchVisitorEntries: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsersState] = useState<UserProfile[]>([]);
  const [visitorEntries, setVisitorEntriesState] = useState<VisitorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const router = useRouter();
  const { toast } = useToast();

  // Effect for initial setup (e.g. checking for a stored session, not implemented here)
  useEffect(() => {
    // initializeCosmosDB(); // CosmosDB initialization is now self-contained in its module
    // For now, we assume no session persistence beyond client state.
    // A real app would check for a session token here.
    setIsLoading(false); // Done with initial "session" check
  }, []);


  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData: UserProfile[] = await response.json();
      setAllUsersState(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: 'Error', description: 'Could not load user data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchVisitorEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/visitors');
      if (!response.ok) {
        throw new Error('Failed to fetch visitor entries');
      }
      const entriesData: VisitorEntry[] = await response.json();
      setVisitorEntriesState(entriesData);
    } catch (error) {
      console.error("Failed to fetch visitor entries:", error);
      toast({ title: 'Error', description: 'Could not load visitor entries.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);


  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
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
        setUser(null); // Ensure user is not set
        return false;
      }

      setUser(loggedInUser);
      toast({ title: 'Login Successful', description: `Welcome back, ${loggedInUser.name}!` });
      router.push('/dashboard');
      return true;
    } catch (error) {
      toast({ title: 'Login Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // In a real app with server-side sessions, call an API to invalidate the session.
    router.push('/login');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'role' | 'registrationDate'> & {password: string}): Promise<boolean> => {
    setIsLoading(true);
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
      toast({ title: 'Registration Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const approveResident = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
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
      await fetchAllUsers(); // Refresh the list of users
      return true;
    } catch (error) {
      toast({ title: 'Approval Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
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
