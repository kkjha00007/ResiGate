
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserProfile, VisitorEntry, GatePass } from './types';
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
  isGuard: () => boolean;
  allUsers: UserProfile[];
  fetchAllUsers: () => Promise<void>;
  visitorEntries: VisitorEntry[];
  fetchVisitorEntries: () => Promise<void>;
  gatePasses: GatePass[];
  fetchGatePasses: () => Promise<void>;
  createGatePass: (passData: Omit<GatePass, 'id' | 'tokenCode' | 'status' | 'createdAt' | 'updatedAt' | 'residentUserId' | 'residentFlatNumber'>) => Promise<GatePass | null>;
  cancelGatePass: (passId: string) => Promise<boolean>;
  markGatePassUsed: (passId: string, guardId: string) => Promise<{visitorEntry: VisitorEntry, updatedPass: GatePass} | null>;
  fetchGatePassByToken: (tokenCode: string) => Promise<GatePass | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsersState] = useState<UserProfile[]>([]);
  const [visitorEntries, setVisitorEntriesState] = useState<VisitorEntry[]>([]);
  const [gatePasses, setGatePassesState] = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(false); 
  }, []);


  const fetchAllUsers = useCallback(async () => {
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

  const fetchGatePasses = useCallback(async () => {
    if (!user) return;
    try {
      // For residents/admins, fetch their own passes
      // For guards, this might fetch all pending passes or be handled differently
      // For now, sticking to user-specific passes. Guards might need a different fetch.
      const response = await fetch(`/api/gate-passes/user/${user.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch gate passes.' }));
        throw new Error(errorData.message || 'Server error while fetching gate passes.');
      }
      const passesData: GatePass[] = await response.json();
      setGatePassesState(passesData);
    } catch (error) {
      console.error("Failed to fetch gate passes:", error);
      toast({ title: 'Error Loading Gate Passes', description: (error as Error).message, variant: 'destructive' });
    }
  }, [user, toast]);

  const createGatePass = async (passData: Omit<GatePass, 'id' | 'tokenCode' | 'status' | 'createdAt' | 'updatedAt' | 'residentUserId' | 'residentFlatNumber'>): Promise<GatePass | null> => {
    if (!user || !user.flatNumber) {
      toast({ title: 'Error', description: 'User or flat number missing.', variant: 'destructive' });
      return null;
    }
    const submissionData = {
        ...passData,
        residentUserId: user.id,
        residentFlatNumber: user.flatNumber,
    };
    try {
        const response = await fetch('/api/gate-passes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
        });
        const data = await response.json();
        if (!response.ok) {
            toast({ title: 'Gate Pass Creation Failed', description: data.message || 'Could not create pass.', variant: 'destructive' });
            return null;
        }
        toast({ title: 'Gate Pass Created', description: `Pass for ${data.visitorName} created. Token: ${data.tokenCode}` });
        await fetchGatePasses(); 
        return data as GatePass;
    } catch (error) {
        toast({ title: 'Gate Pass Creation Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
        return null;
    }
  };

  const cancelGatePass = async (passId: string): Promise<boolean> => {
    try {
        const response = await fetch(`/api/gate-passes/${passId}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) {
            toast({ title: 'Gate Pass Cancellation Failed', description: data.message || 'Could not cancel pass.', variant: 'destructive' });
            return false;
        }
        toast({ title: 'Gate Pass Cancelled', description: `Pass ID ${passId} has been cancelled.` });
        await fetchGatePasses(); 
        return true;
    } catch (error) {
        toast({ title: 'Gate Pass Cancellation Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
        return false;
    }
  };

  const markGatePassUsed = async (passId: string, guardId: string): Promise<{visitorEntry: VisitorEntry, updatedPass: GatePass} | null> => {
    try {
      const response = await fetch(`/api/gate-passes/${passId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Used', markedUsedBy: guardId }), // Pass guardId for audit
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Gate Pass Update Failed', description: data.message || 'Could not mark pass as used.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Gate Pass Marked as Used', description: `Pass for ${data.updatedPass.visitorName} processed.` });
      await fetchGatePasses(); // Refresh resident's list if they are viewing
      await fetchVisitorEntries(); // Refresh visitor log
      return data;
    } catch (error) {
      toast({ title: 'Gate Pass Update Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const fetchGatePassByToken = async (tokenCode: string): Promise<GatePass | null> => {
    try {
      const response = await fetch(`/api/gate-passes/by-token/${tokenCode}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({ title: 'Not Found', description: 'No gate pass found with this token.', variant: 'destructive' });
          return null;
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch gate pass by token.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch gate pass by token:", error);
      toast({ title: 'Error Fetching Pass', description: (error as Error).message, variant: 'destructive' });
      return null;
    }
  };


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
        setUser(null); 
        return false;
      }

      setUser(loggedInUser);
      toast({ title: 'Login Successful', description: `Welcome back, ${loggedInUser.name}!` });
      router.push('/dashboard');
      return true;
    } catch (error) {
      toast({ title: 'Login Error', description: (error as Error).message || 'An unexpected error occurred during login.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAllUsersState([]);
    setVisitorEntriesState([]);
    setGatePassesState([]);
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
      toast({ title: 'Registration Error', description: (error as Error).message || 'An unexpected error occurred during registration.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const approveResident = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }), // Only approving, role changes should be separate
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
      toast({ title: 'Approval Error', description: (error as Error).message || 'An unexpected error occurred during approval.', variant: 'destructive' });
      return false;
    }
  };
  
  const isAdmin = useCallback(() => user?.role === USER_ROLES.SUPERADMIN, [user]);
  const isResident = useCallback(() => user?.role === USER_ROLES.RESIDENT, [user]);
  const isGuard = useCallback(() => user?.role === USER_ROLES.GUARD, [user]);

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
        isGuard, 
        allUsers, 
        fetchAllUsers,
        visitorEntries,
        fetchVisitorEntries,
        gatePasses,
        fetchGatePasses,
        createGatePass,
        cancelGatePass,
        markGatePassUsed,
        fetchGatePassByToken,
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
