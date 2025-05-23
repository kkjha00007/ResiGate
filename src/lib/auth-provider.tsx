
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserProfile, VisitorEntry, GatePass, UserRole, Complaint, Notice } from './types'; // Added Notice
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { USER_ROLES, PUBLIC_ENTRY_SOURCE } from './constants'; 
import { GATE_PASS_STATUSES } from './types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'isApproved' | 'registrationDate' | 'password'> & {password: string, role: Exclude<UserRole, "superadmin">}) => Promise<boolean>;
  approveResident: (userId: string) => Promise<boolean>;
  rejectUser: (userId: string) => Promise<boolean>;
  updateUserProfile: (userId: string, updates: { name?: string; secondaryPhoneNumber1?: string; secondaryPhoneNumber2?: string }) => Promise<UserProfile | null>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  isAdmin: () => boolean;
  isOwnerOrRenter: () => boolean;
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
  myComplaints: Complaint[];
  submitComplaint: (complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'status' | 'userId' | 'userName' | 'userFlatNumber'>) => Promise<Complaint | null>;
  fetchMyComplaints: () => Promise<void>;
  activeNotices: Notice[];
  fetchActiveNotices: () => Promise<void>;
  createNotice: (noticeData: { title: string; content: string; }) => Promise<Notice | null>;
  // Future notice management functions for admin:
  // allNoticesAdmin: Notice[];
  // fetchAllNoticesAdmin: () => Promise<void>;
  // updateNotice: (noticeId: string, updates: Partial<Omit<Notice, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear'>>) => Promise<Notice | null>;
  // deleteNotice: (noticeId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsersState] = useState<UserProfile[]>([]);
  const [visitorEntries, setVisitorEntriesState] = useState<VisitorEntry[]>([]);
  const [gatePasses, setGatePassesState] = useState<GatePass[]>([]);
  const [myComplaints, setMyComplaintsState] = useState<Complaint[]>([]);
  const [activeNotices, setActiveNoticesState] = useState<Notice[]>([]); // New state for active notices
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
        body: JSON.stringify({ status: GATE_PASS_STATUSES.USED, markedUsedBy: guardId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Gate Pass Update Failed', description: data.message || 'Could not mark pass as used.', variant: 'destructive' });
        return null;
      }
      // Toast message can be more concise or specific here
      toast({ title: 'Gate Pass Processed', description: `Visitor entry created. Pass marked as used.` });
      await fetchGatePasses(); 
      await fetchVisitorEntries(); 
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
      if ((loggedInUser.role === USER_ROLES.OWNER || loggedInUser.role === USER_ROLES.RENTER || loggedInUser.role === USER_ROLES.GUARD) && !loggedInUser.isApproved) {
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
    setMyComplaintsState([]); 
    setActiveNoticesState([]); // Clear notices on logout
    router.push('/');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'registrationDate' | 'password'> & {password: string, role: Exclude<UserRole, "superadmin">}): Promise<boolean> => {
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
        body: JSON.stringify({ isApproved: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Approval Failed', description: data.message || 'Could not approve user.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'User Approved', description: `${data.name} (${data.role}) has been approved.` });
      await fetchAllUsers();
      return true;
    } catch (error) {
      toast({ title: 'Approval Error', description: (error as Error).message || 'An unexpected error occurred during approval.', variant: 'destructive' });
      return false;
    }
  };

  const rejectUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to reject user.' }));
        toast({ title: 'Rejection Failed', description: data.message || 'Could not reject user.', variant: 'destructive' });
        return false;
      }
      const data = await response.json();
      toast({ title: 'User Rejected', description: `Registration for ${data.name} has been rejected and removed.` });
      await fetchAllUsers(); 
      return true;
    } catch (error) {
      toast({ title: 'Rejection Error', description: (error as Error).message || 'An unexpected error occurred during rejection.', variant: 'destructive' });
      return false;
    }
  };

  const updateUserProfile = async (userId: string, updates: { name?: string; secondaryPhoneNumber1?: string; secondaryPhoneNumber2?: string }): Promise<UserProfile | null> => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Profile Update Failed', description: data.message || 'Could not update profile.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
      if (user && user.id === userId) { 
        setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
      }
      return data as UserProfile;
    } catch (error) {
      toast({ title: 'Profile Update Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Password Change Failed', description: data.message || 'Could not change password.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Password Changed', description: 'Your password has been successfully changed.' });
      return true;
    } catch (error) {
      toast({ title: 'Password Change Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  // Complaint Functions
  const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'status' | 'userId' | 'userName' | 'userFlatNumber'>): Promise<Complaint | null> => {
    if (!user || !user.flatNumber) {
      toast({ title: 'Error', description: 'You must be logged in as a resident to submit a complaint.', variant: 'destructive' });
      return null;
    }
    const submissionData = {
      ...complaintData,
      userId: user.id,
      userName: user.name,
      userFlatNumber: user.flatNumber,
    };
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Complaint Submission Failed', description: data.message || 'Could not submit complaint.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Complaint Submitted', description: 'Your complaint has been successfully submitted.' });
      await fetchMyComplaints(); 
      return data as Complaint;
    } catch (error) {
      toast({ title: 'Complaint Submission Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const fetchMyComplaints = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/complaints/user/${user.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your complaints.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const complaintsData: Complaint[] = await response.json();
      setMyComplaintsState(complaintsData);
    } catch (error) {
      console.error("Failed to fetch my complaints:", error);
      toast({ title: 'Error Loading Complaints', description: (error as Error).message, variant: 'destructive' });
    }
  }, [user, toast]);

  // Notice Functions
  const fetchActiveNotices = useCallback(async () => {
    try {
      const response = await fetch('/api/notices');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch active notices.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const noticesData: Notice[] = await response.json();
      setActiveNoticesState(noticesData);
    } catch (error) {
      console.error("Failed to fetch active notices:", error);
      toast({ title: 'Error Loading Notices', description: (error as Error).message, variant: 'destructive' });
    }
  }, [toast]);

  const createNotice = async (noticeData: { title: string; content: string; }): Promise<Notice | null> => {
    if (!user || user.role !== USER_ROLES.SUPERADMIN) {
        toast({ title: 'Unauthorized', description: 'Only super admins can create notices.', variant: 'destructive' });
        return null;
    }
    const submissionData = {
        ...noticeData,
        postedByUserId: user.id,
        postedByName: user.name,
    };
    try {
        const response = await fetch('/api/notices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
        });
        const data = await response.json();
        if (!response.ok) {
            toast({ title: 'Notice Creation Failed', description: data.message || 'Could not create notice.', variant: 'destructive' });
            return null;
        }
        toast({ title: 'Notice Created', description: `Notice "${data.title}" has been posted.` });
        await fetchActiveNotices(); // Refresh active notices for all
        // await fetchAllNoticesAdmin(); // If admin needs to see all notices immediately
        return data as Notice;
    } catch (error) {
        toast({ title: 'Notice Creation Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
        return null;
    }
  };


  const isAdmin = useCallback(() => user?.role === USER_ROLES.SUPERADMIN, [user]);
  const isOwnerOrRenter = useCallback(() => user?.role === USER_ROLES.OWNER || user?.role === USER_ROLES.RENTER, [user]);
  const isGuard = useCallback(() => user?.role === USER_ROLES.GUARD, [user]);

  return (
    <AuthContext.Provider value={{
        user,
        isLoading,
        login,
        logout,
        register,
        approveResident,
        rejectUser,
        updateUserProfile,
        changePassword,
        isAdmin,
        isOwnerOrRenter,
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
        myComplaints,
        submitComplaint,
        fetchMyComplaints,
        activeNotices,
        fetchActiveNotices,
        createNotice,
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
