
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserProfile, VisitorEntry, GatePass, UserRole, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails } from './types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { USER_ROLES, PUBLIC_ENTRY_SOURCE } from './constants';
import { GATE_PASS_STATUSES } from './types';
import { format, parseISO } from 'date-fns';

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
  allNoticesForAdmin: Notice[];
  fetchAllNoticesForAdmin: () => Promise<void>;
  updateNotice: (noticeId: string, currentMonthYear: string, updates: Partial<Omit<Notice, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt'>>) => Promise<Notice | null>;
  deleteNotice: (noticeId: string, currentMonthYear: string) => Promise<boolean>;
  upcomingMeetings: Meeting[];
  fetchUpcomingMeetings: () => Promise<void>;
  createMeeting: (meetingData: Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'isActive' | 'monthYear' | 'updatedAt'>) => Promise<Meeting | null>;
  allMeetingsForAdmin: Meeting[];
  fetchAllMeetingsForAdmin: () => Promise<void>;
  updateMeeting: (meetingId: string, currentMonthYear: string, updates: Partial<Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt'>>) => Promise<Meeting | null>;
  deleteMeeting: (meetingId: string, currentMonthYear: string) => Promise<boolean>;
  approvedVendors: Vendor[];
  fetchApprovedVendors: () => Promise<void>;
  submitNewVendor: (vendorData: Omit<Vendor, 'id' | 'submittedAt' | 'isApproved' | 'submittedByUserId' | 'submittedByName' | 'approvedByUserId' | 'approvedAt'>) => Promise<Vendor | null>;
  pendingVendors: Vendor[];
  fetchPendingVendors: () => Promise<void>;
  approveVendor: (vendorId: string) => Promise<Vendor | null>;
  rejectVendor: (vendorId: string) => Promise<boolean>;
  committeeMembers: CommitteeMember[];
  fetchCommitteeMembers: () => Promise<void>;
  addCommitteeMember: (memberData: Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CommitteeMember | null>;
  updateCommitteeMember: (memberId: string, memberData: Partial<Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<CommitteeMember | null>;
  deleteCommitteeMember: (memberId: string) => Promise<boolean>;
  societyPaymentDetails: SocietyPaymentDetails | null;
  fetchSocietyPaymentDetails: () => Promise<void>;
  updateSocietyPaymentDetails: (details: Omit<SocietyPaymentDetails, 'id' | 'updatedAt'>) => Promise<SocietyPaymentDetails | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsersState] = useState<UserProfile[]>([]);
  const [visitorEntries, setVisitorEntriesState] = useState<VisitorEntry[]>([]);
  const [gatePasses, setGatePassesState] = useState<GatePass[]>([]);
  const [myComplaints, setMyComplaintsState] = useState<Complaint[]>([]);
  const [activeNotices, setActiveNoticesState] = useState<Notice[]>([]);
  const [allNoticesForAdmin, setAllNoticesForAdminState] = useState<Notice[]>([]);
  const [upcomingMeetings, setUpcomingMeetingsState] = useState<Meeting[]>([]);
  const [allMeetingsForAdmin, setAllMeetingsForAdminState] = useState<Meeting[]>([]);
  const [approvedVendors, setApprovedVendorsState] = useState<Vendor[]>([]);
  const [pendingVendors, setPendingVendorsState] = useState<Vendor[]>([]);
  const [committeeMembers, setCommitteeMembersState] = useState<CommitteeMember[]>([]);
  const [societyPaymentDetails, setSocietyPaymentDetailsState] = useState<SocietyPaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = useCallback(() => user?.role === USER_ROLES.SUPERADMIN, [user]);
  const isOwnerOrRenter = useCallback(() => user?.role === USER_ROLES.OWNER || user?.role === USER_ROLES.RENTER, [user]);
  const isGuard = useCallback(() => user?.role === USER_ROLES.GUARD, [user]);

  const _fetchActiveNotices = useCallback(async () => {
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
      setActiveNoticesState([]);
    }
  }, []);

  const _fetchUpcomingMeetings = useCallback(async () => {
    try {
      const response = await fetch('/api/meetings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch upcoming meetings.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const meetingsData: Meeting[] = await response.json();
      setUpcomingMeetingsState(meetingsData);
    } catch (error) {
      console.error("Failed to fetch upcoming meetings:", error);
      setUpcomingMeetingsState([]);
    }
  }, []);

  const _fetchApprovedVendors = useCallback(async () => {
    try {
      const response = await fetch('/api/vendors');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch approved vendors.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const vendorsData: Vendor[] = await response.json();
      setApprovedVendorsState(vendorsData);
    } catch (error) {
      console.error("Failed to fetch approved vendors:", error);
      toast({ title: 'Error Loading Vendors', description: (error as Error).message, variant: 'destructive' });
      setApprovedVendorsState([]);
    }
  }, [toast]);

  const _fetchCommitteeMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/committee-members');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch committee members.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const membersData: CommitteeMember[] = await response.json();
      setCommitteeMembersState(membersData);
    } catch (error) {
      console.error("Failed to fetch committee members:", error);
      toast({ title: 'Error Loading Committee Members', description: (error as Error).message, variant: 'destructive' });
      setCommitteeMembersState([]);
    }
  }, [toast]);

  const _fetchSocietyPaymentDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/payment-details');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch payment details.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const details: SocietyPaymentDetails = await response.json();
      setSocietyPaymentDetailsState(details);
    } catch (error) {
      console.error("Failed to fetch society payment details:", error);
      toast({ title: 'Error Loading Payment Details', description: (error as Error).message, variant: 'destructive' });
      setSocietyPaymentDetailsState(null);
    }
  }, [toast]);


  useEffect(() => {
    const checkUserSession = () => {
      setIsLoading(false);
    };
    checkUserSession();
    _fetchActiveNotices();
    _fetchUpcomingMeetings();
    _fetchApprovedVendors();
    _fetchCommitteeMembers();
    _fetchSocietyPaymentDetails();
  }, [_fetchActiveNotices, _fetchUpcomingMeetings, _fetchApprovedVendors, _fetchCommitteeMembers, _fetchSocietyPaymentDetails]);


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
      toast({ title: 'Error Loading Users', description: `Failed to retrieve user list from database. Detail: ${(error as Error).message}`, variant: 'destructive' });
      setAllUsersState([]);
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
      setVisitorEntriesState([]);
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
      setGatePassesState([]);
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
      if (user?.role !== USER_ROLES.GUARD) {
          await fetchGatePasses(); 
      }
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
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch gate pass by token.' }));
            toast({ title: 'Error Fetching Pass', description: errorData.message || 'Server error.', variant: 'destructive' });
        }
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch gate pass by token:", error);
      toast({ title: 'Error Fetching Pass', description: (error as Error).message, variant: 'destructive' });
      return null;
    }
  };


  const login = async (email: string, passwordString: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordString }),
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
      
      await _fetchActiveNotices();
      await _fetchUpcomingMeetings();
      await _fetchApprovedVendors();
      await _fetchCommitteeMembers();
      await _fetchSocietyPaymentDetails();


      if (loggedInUser.role === USER_ROLES.SUPERADMIN) {
        await fetchAllUsers(); 
        await fetchAllNoticesForAdmin();
        await fetchAllMeetingsForAdmin();
        await fetchPendingVendors();
      }
      if (isOwnerOrRenter()) { // Use the helper function
        await fetchMyComplaints();
        await fetchGatePasses();
      }
      await fetchVisitorEntries(); 

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
    setActiveNoticesState([]);
    setAllNoticesForAdminState([]);
    setUpcomingMeetingsState([]);
    setAllMeetingsForAdminState([]);
    setApprovedVendorsState([]);
    setPendingVendorsState([]);
    setCommitteeMembersState([]);
    setSocietyPaymentDetailsState(null);
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
      toast({ title: 'Registration Successful', description: 'Your account has been created and is pending approval by an admin.' });
      router.push('/'); 
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
      setMyComplaintsState([]);
    }
  }, [user, toast]);

  const fetchActiveNotices = _fetchActiveNotices; 

  const createNotice = async (noticeData: { title: string; content: string; }): Promise<Notice | null> => {
    if (!user || !isAdmin()) { 
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
        await fetchActiveNotices(); 
        await fetchAllNoticesForAdmin(); 
        return data as Notice;
    } catch (error) {
        toast({ title: 'Notice Creation Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
        return null;
    }
  };

  const fetchAllNoticesForAdmin = useCallback(async () => {
    if (!isAdmin()) return;
    try {
      const response = await fetch('/api/notices/admin/all');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notices for admin.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const noticesData: Notice[] = await response.json();
      setAllNoticesForAdminState(noticesData);
    } catch (error) {
      console.error("Failed to fetch all notices for admin:", error);
      toast({ title: 'Error Loading Admin Notices', description: (error as Error).message, variant: 'destructive' });
      setAllNoticesForAdminState([]);
    }
  }, [toast, user, isAdmin]); 

  const updateNotice = async (noticeId: string, currentMonthYear: string, updates: Partial<Omit<Notice, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt'>>): Promise<Notice | null> => {
    if (!isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can update notices.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        
        body: JSON.stringify({ ...updates, monthYear: currentMonthYear }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Notice Update Failed', description: data.message || 'Could not update notice.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Notice Updated', description: `Notice "${data.title}" has been updated.` });
      await fetchActiveNotices();
      await fetchAllNoticesForAdmin();
      return data as Notice;
    } catch (error) {
      toast({ title: 'Notice Update Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const deleteNotice = async (noticeId: string, currentMonthYear: string): Promise<boolean> => {
    if (!isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can delete notices.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/notices/${noticeId}?monthYear=${encodeURIComponent(currentMonthYear)}`, { 
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete notice.' }));
        toast({ title: 'Notice Deletion Failed', description: data.message || 'Could not delete notice.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Notice Deleted', description: 'The notice has been successfully deleted.' });
      await fetchActiveNotices();
      await fetchAllNoticesForAdmin();
      return true;
    } catch (error) {
      toast({ title: 'Notice Deletion Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const fetchUpcomingMeetings = _fetchUpcomingMeetings; 

  const createMeeting = async (meetingData: Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'isActive' | 'monthYear' | 'updatedAt'>): Promise<Meeting | null> => {
    if (!user || !isAdmin()) { 
        toast({ title: 'Unauthorized', description: 'Only super admins can create meetings.', variant: 'destructive' });
        return null;
    }
    const submissionData = {
        ...meetingData,
        postedByUserId: user.id,
        postedByName: user.name,
    };
    try {
        const response = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
        });
        const data = await response.json();
        if (!response.ok) {
            toast({ title: 'Meeting Creation Failed', description: data.message || 'Could not create meeting.', variant: 'destructive' });
            return null;
        }
        toast({ title: 'Meeting Created', description: `Meeting "${data.title}" has been scheduled.` });
        await fetchUpcomingMeetings();
        await fetchAllMeetingsForAdmin();
        return data as Meeting;
    } catch (error) {
        toast({ title: 'Meeting Creation Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
        return null;
    }
  };

  const fetchAllMeetingsForAdmin = useCallback(async () => {
    if (!isAdmin()) return;
    try {
      const response = await fetch('/api/meetings/admin/all');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch meetings for admin.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const meetingsData: Meeting[] = await response.json();
      setAllMeetingsForAdminState(meetingsData);
    } catch (error) {
      console.error("Failed to fetch all meetings for admin:", error);
      toast({ title: 'Error Loading Admin Meetings', description: (error as Error).message, variant: 'destructive' });
      setAllMeetingsForAdminState([]);
    }
  }, [toast, user, isAdmin]); 

  const updateMeeting = async (meetingId: string, currentMonthYear: string, updates: Partial<Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt'>>): Promise<Meeting | null> => {
    if (!isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can update meetings.', variant: 'destructive' });
      return null;
    }
    
    const body = { ...updates, monthYear: currentMonthYear };

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Meeting Update Failed', description: data.message || 'Could not update meeting.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Meeting Updated', description: `Meeting "${data.title}" has been updated.` });
      await fetchUpcomingMeetings();
      await fetchAllMeetingsForAdmin();
      return data as Meeting;
    } catch (error) {
      toast({ title: 'Meeting Update Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const deleteMeeting = async (meetingId: string, currentMonthYear: string): Promise<boolean> => {
    if (!isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can delete meetings.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/meetings/${meetingId}?monthYear=${encodeURIComponent(currentMonthYear)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete meeting.' }));
        toast({ title: 'Meeting Deletion Failed', description: data.message || 'Could not delete meeting.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Meeting Deleted', description: 'The meeting has been successfully deleted.' });
      await fetchUpcomingMeetings();
      await fetchAllMeetingsForAdmin();
      return true;
    } catch (error) {
      toast({ title: 'Meeting Deletion Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const fetchApprovedVendors = _fetchApprovedVendors; 

  const submitNewVendor = async (vendorData: Omit<Vendor, 'id' | 'submittedAt' | 'isApproved' | 'submittedByUserId' | 'submittedByName' | 'approvedByUserId' | 'approvedAt'>): Promise<Vendor | null> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to submit a vendor.', variant: 'destructive' });
      return null;
    }
    const submissionData = {
      ...vendorData,
      submittedByUserId: user.id,
      submittedByName: user.name,
    };

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Vendor Submission Failed', description: data.message || 'Could not submit vendor for review.', variant: 'destructive' });
        return null;
      }
      return data as Vendor;
    } catch (error) {
      toast({ title: 'Vendor Submission Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const fetchPendingVendors = useCallback(async () => {
    if (!isAdmin()) return;
    try {
      const response = await fetch('/api/vendors/admin/pending');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch pending vendors.' }));
        throw new Error(errorData.message || 'Server error.');
      }
      const vendorsData: Vendor[] = await response.json();
      setPendingVendorsState(vendorsData); 
    } catch (error) {
      console.error("Failed to fetch pending vendors:", error);
      toast({ title: 'Error Loading Pending Vendors', description: (error as Error).message, variant: 'destructive' });
      setPendingVendorsState([]); 
    }
  }, [toast, user, isAdmin]); 

  const approveVendor = async (vendorId: string): Promise<Vendor | null> => {
    if (!user || !isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can approve vendors.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch(`/api/vendors/admin/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isApproved: true,
          approvedByUserId: user.id, 
         }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Vendor Approval Failed', description: data.message || 'Could not approve vendor.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Vendor Approved', description: `Vendor "${data.name}" has been approved and added to the directory.` });
      await fetchPendingVendors(); 
      await fetchApprovedVendors(); 
      return data as Vendor;
    } catch (error) {
      toast({ title: 'Vendor Approval Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const rejectVendor = async (vendorId: string): Promise<boolean> => {
     if (!isAdmin()) { 
      toast({ title: 'Unauthorized', description: 'Only super admins can reject vendors.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/vendors/admin/${vendorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to reject vendor.' }));
        toast({ title: 'Vendor Rejection Failed', description: data.message || 'Could not reject vendor submission.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Vendor Rejected', description: 'The vendor submission has been successfully rejected and removed.' });
      await fetchPendingVendors(); 
      return true;
    } catch (error) {
      toast({ title: 'Vendor Rejection Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const fetchCommitteeMembers = _fetchCommitteeMembers;

  const addCommitteeMember = async (memberData: Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommitteeMember | null> => {
    if (!isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can add committee members.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch('/api/committee-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Failed to Add Member', description: data.message || 'Could not add committee member.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Member Added', description: `${data.name} has been added to the committee.` });
      await fetchCommitteeMembers();
      return data as CommitteeMember;
    } catch (error) {
      toast({ title: 'Error Adding Member', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const updateCommitteeMember = async (memberId: string, memberData: Partial<Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CommitteeMember | null> => {
    if (!isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can update committee members.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch(`/api/committee-members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Failed to Update Member', description: data.message || 'Could not update committee member.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Member Updated', description: `${data.name}'s details have been updated.` });
      await fetchCommitteeMembers();
      return data as CommitteeMember;
    } catch (error) {
      toast({ title: 'Error Updating Member', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const deleteCommitteeMember = async (memberId: string): Promise<boolean> => {
    if (!isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can delete committee members.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/committee-members/${memberId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete member.'}));
        toast({ title: 'Failed to Delete Member', description: data.message || 'Could not delete committee member.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Member Deleted', description: 'The committee member has been removed.' });
      await fetchCommitteeMembers();
      return true;
    } catch (error) {
      toast({ title: 'Error Deleting Member', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const fetchSocietyPaymentDetails = _fetchSocietyPaymentDetails;

  const updateSocietyPaymentDetails = async (details: Omit<SocietyPaymentDetails, 'id' | 'updatedAt'>): Promise<SocietyPaymentDetails | null> => {
    if (!isAdmin()) {
      toast({ title: 'Unauthorized', description: 'Only super admins can update payment details.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch('/api/settings/payment-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Update Failed', description: data.message || 'Could not update payment details.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Payment Details Updated', description: 'Society payment details have been updated.' });
      setSocietyPaymentDetailsState(data as SocietyPaymentDetails); // Update local state
      return data as SocietyPaymentDetails;
    } catch (error) {
      toast({ title: 'Update Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };


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
        allNoticesForAdmin,
        fetchAllNoticesForAdmin,
        updateNotice,
        deleteNotice,
        upcomingMeetings,
        fetchUpcomingMeetings,
        createMeeting,
        allMeetingsForAdmin,
        fetchAllMeetingsForAdmin,
        updateMeeting,
        deleteMeeting,
        approvedVendors,
        fetchApprovedVendors,
        submitNewVendor,
        pendingVendors,
        fetchPendingVendors,
        approveVendor,
        rejectVendor,
        committeeMembers,
        fetchCommitteeMembers,
        addCommitteeMember,
        updateCommitteeMember,
        deleteCommitteeMember,
        societyPaymentDetails,
        fetchSocietyPaymentDetails,
        updateSocietyPaymentDetails,
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
