
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserProfile, VisitorEntry, GatePass, UserRole, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails, NeighbourProfile, ParkingSpot, SocietyInfoSettings, Facility } from './types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { USER_ROLES, PUBLIC_ENTRY_SOURCE } from './constants';
import { GATE_PASS_STATUSES } from './types';
import { format, parseISO } from 'date-fns';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isLoadingUser: boolean;
  isFetchingInitialData: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'isApproved' | 'registrationDate' | 'password' | 'tenantId'> & {password: string, role: Exclude<UserRole, "superadmin">, societyName: string}) => Promise<boolean>;
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
  createGatePass: (passData: Omit<GatePass, 'id' | 'tokenCode' | 'status' | 'createdAt' | 'updatedAt' | 'residentUserId' | 'residentFlatNumber' | 'tenantId'>) => Promise<GatePass | null>;
  cancelGatePass: (passId: string) => Promise<boolean>;
  markGatePassUsed: (passId: string, guardId: string) => Promise<{visitorEntry: VisitorEntry, updatedPass: GatePass} | null>;
  fetchGatePassByToken: (tokenCode: string) => Promise<GatePass | null>;
  myComplaints: Complaint[];
  submitComplaint: (complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'status' | 'userId' | 'userName' | 'userFlatNumber' | 'tenantId'>) => Promise<Complaint | null>;
  fetchMyComplaints: () => Promise<void>;
  activeNotices: Notice[];
  fetchActiveNotices: () => Promise<void>;
  createNotice: (noticeData: { title: string; content: string; }) => Promise<Notice | null>;
  allNoticesForAdmin: Notice[];
  fetchAllNoticesForAdmin: () => Promise<void>;
  updateNotice: (noticeId: string, currentMonthYear: string, updates: Partial<Omit<Notice, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt' | 'tenantId'>>) => Promise<Notice | null>;
  deleteNotice: (noticeId: string, currentMonthYear: string) => Promise<boolean>;
  upcomingMeetings: Meeting[];
  fetchUpcomingMeetings: () => Promise<void>;
  createMeeting: (meetingData: Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'isActive' | 'monthYear' | 'updatedAt' | 'tenantId'>) => Promise<Meeting | null>;
  allMeetingsForAdmin: Meeting[];
  fetchAllMeetingsForAdmin: () => Promise<void>;
  updateMeeting: (meetingId: string, currentMonthYear: string, updates: Partial<Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt' | 'tenantId'>>) => Promise<Meeting | null>;
  deleteMeeting: (meetingId: string, currentMonthYear: string) => Promise<boolean>;
  approvedVendors: Vendor[];
  fetchApprovedVendors: () => Promise<void>;
  submitNewVendor: (vendorData: Omit<Vendor, 'id' | 'submittedAt' | 'isApproved' | 'submittedByUserId' | 'submittedByName' | 'approvedByUserId' | 'approvedAt' | 'tenantId'>) => Promise<Vendor | null>;
  pendingVendors: Vendor[];
  fetchPendingVendors: () => Promise<void>;
  approveVendor: (vendorId: string) => Promise<Vendor | null>;
  rejectVendor: (vendorId: string) => Promise<boolean>;
  committeeMembers: CommitteeMember[];
  fetchCommitteeMembers: () => Promise<void>;
  addCommitteeMember: (memberData: Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>) => Promise<CommitteeMember | null>;
  updateCommitteeMember: (memberId: string, memberData: Partial<Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>) => Promise<CommitteeMember | null>;
  deleteCommitteeMember: (memberId: string) => Promise<boolean>;
  societyPaymentDetails: SocietyPaymentDetails | null;
  fetchSocietyPaymentDetails: () => Promise<void>;
  updateSocietyPaymentDetails: (details: Omit<SocietyPaymentDetails, 'id' | 'updatedAt' | 'tenantId'>) => Promise<SocietyPaymentDetails | null>;
  societyInfo: SocietyInfoSettings | null;
  fetchSocietyInfo: () => Promise<void>;
  updateSocietyInfo: (settings: Omit<SocietyInfoSettings, 'id' | 'updatedAt' | 'tenantId'>) => Promise<SocietyInfoSettings | null>;
  approvedResidents: NeighbourProfile[];
  fetchApprovedResidents: () => Promise<void>;
  allParkingSpots: ParkingSpot[]; 
  fetchAllParkingSpots: () => Promise<void>; 
  myParkingSpots: ParkingSpot[]; 
  fetchMyParkingSpots: () => Promise<void>; 
  createParkingSpot: (spotData: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tenantId'>) => Promise<ParkingSpot | null>; 
  updateParkingSpot: (spotId: string, updates: Partial<Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>) => Promise<ParkingSpot | null>; 
  deleteParkingSpot: (spotId: string) => Promise<boolean>; 
  facilities: Facility[];
  fetchFacilities: () => Promise<void>;
  createFacility: (facilityData: Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'tenantId'>) => Promise<Facility | null>;
  updateFacility: (facilityId: string, updates: Partial<Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>) => Promise<Facility | null>;
  deleteFacility: (facilityId: string) => Promise<boolean>;
  // Removed initialDataFetch from context type as it's internal to provider
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
  const [societyInfo, setSocietyInfoState] = useState<SocietyInfoSettings | null>(null);
  const [approvedResidents, setApprovedResidentsState] = useState<NeighbourProfile[]>([]);
  const [allParkingSpots, setAllParkingSpotsState] = useState<ParkingSpot[]>([]);
  const [myParkingSpots, setMyParkingSpotsState] = useState<ParkingSpot[]>([]);
  const [facilities, setFacilitiesState] = useState<Facility[]>([]);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(false);
  const isLoading = isLoadingUser || isFetchingInitialData;

  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = useCallback(() => user?.role === USER_ROLES.SUPERADMIN, [user]);
  const isOwnerOrRenter = useCallback(() => user?.role === USER_ROLES.OWNER || user?.role === USER_ROLES.RENTER, [user]);
  const isGuard = useCallback(() => user?.role === USER_ROLES.GUARD, [user]);


  // Tenant-aware fetching functions (Most of these need to be updated to pass tenantId)
  // For now, they might fetch globally or fail if tenantId is strictly required by API
  const _fetchActiveNotices = useCallback(async () => {
    if (!user?.tenantId && process.env.NODE_ENV !== 'development') { // Allow global fetch in dev for now
        setActiveNoticesState([]); return;
    }
    try {
      // TODO: Update API to accept tenantId: /api/notices?tenantId=${user.tenantId}
      const response = await fetch('/api/notices'); 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch active notices.' }));
        throw new Error(errorData.message || 'Server error while fetching active notices.');
      }
      const noticesData: Notice[] = await response.json();
      setActiveNoticesState(noticesData);
    } catch (error) {
      console.error("Failed to fetch active notices:", error);
      setActiveNoticesState([]);
    }
  }, [user?.tenantId]);

  const _fetchUpcomingMeetings = useCallback(async () => {
    if (!user?.tenantId && process.env.NODE_ENV !== 'development') {
      setUpcomingMeetingsState([]); return;
    }
    try {
      // TODO: Update API to accept tenantId
      const response = await fetch('/api/meetings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch upcoming meetings.' }));
        throw new Error(errorData.message || 'Server error while fetching upcoming meetings.');
      }
      const meetingsData: Meeting[] = await response.json();
      setUpcomingMeetingsState(meetingsData);
    } catch (error) {
      console.error("Failed to fetch upcoming meetings:", error);
      setUpcomingMeetingsState([]);
    }
  }, [user?.tenantId]);

  const _fetchApprovedVendors = useCallback(async () => {
    if (!user?.tenantId && process.env.NODE_ENV !== 'development') {
      setApprovedVendorsState([]); return;
    }
    try {
      // TODO: Update API to accept tenantId
      const response = await fetch('/api/vendors');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch approved vendors.' }));
        throw new Error(errorData.message || 'Server error while fetching approved vendors.');
      }
      const vendorsData: Vendor[] = await response.json();
      setApprovedVendorsState(vendorsData);
    } catch (error) {
      console.error("Failed to fetch approved vendors:", error);
      setApprovedVendorsState([]);
    }
  }, [user?.tenantId]);

  const _fetchCommitteeMembers = useCallback(async () => {
    if (!user?.tenantId && process.env.NODE_ENV !== 'development') {
       setCommitteeMembersState([]); return;
    }
    try {
      // TODO: Update API to accept tenantId
      const response = await fetch('/api/committee-members');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch committee members.' }));
        throw new Error(errorData.message || 'Server error while fetching committee members.');
      }
      const membersData: CommitteeMember[] = await response.json();
      setCommitteeMembersState(membersData);
    } catch (error) {
      console.error("Failed to fetch committee members:", error);
      setCommitteeMembersState([]);
    }
  }, [user?.tenantId]);

  const fetchSocietyPaymentDetails = useCallback(async () => {
    if (!user?.tenantId) {
        setSocietyPaymentDetailsState(null); return;
    }
    try {
      // TODO: Update API to fetch by tenantId: /api/settings/payment-details?tenantId=${user.tenantId}
      const response = await fetch(`/api/settings/payment-details`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch payment details.' }));
        throw new Error(errorData.message || 'Server error while fetching payment details.');
      }
      const details: SocietyPaymentDetails = await response.json();
      setSocietyPaymentDetailsState(details);
    } catch (error) {
      console.error("Failed to fetch society payment details:", error);
      setSocietyPaymentDetailsState(null);
    }
  }, [user?.tenantId]);
  
  const fetchSocietyInfo = useCallback(async () => {
    // Society info might be global or tenant-specific. If tenant-specific, API needs tenantId.
    // For now, assuming it might be fetched by tenantId, but API needs update.
    if (!user?.tenantId && process.env.NODE_ENV !== 'development' ) {
      setSocietyInfoState(null);
      return;
    }
    try {
      // TODO: If society info is per tenant: /api/settings/society-info?tenantId=${user.tenantId}
      const response = await fetch(`/api/settings/society-info`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch society info.' }));
        throw new Error(errorData.message || 'Server error fetching society info.');
      }
      const info: SocietyInfoSettings = await response.json();
      setSocietyInfoState(info);
    } catch (error) {
      console.error("Failed to fetch society info:", error);
      setSocietyInfoState(null);
    }
  }, [user?.tenantId]);


  const _fetchApprovedResidents = useCallback(async () => {
    if (!user?.tenantId) {
       setApprovedResidentsState([]); return;
    }
    try {
      // TODO: Update API to accept tenantId: /api/users/residents?tenantId=${user.tenantId}
      const response = await fetch('/api/users/residents');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch approved residents and could not parse error response from server.' }));
        throw new Error(errorData.message || 'Server error while fetching approved residents.');
      }
      const residentsData: NeighbourProfile[] = await response.json();
      setApprovedResidentsState(residentsData);
    } catch (error: any) {
      console.error("Failed to fetch approved residents:", error.message);
      toast({ title: 'Error Loading Residents Directory', description: error.message, variant: 'destructive' });
      setApprovedResidentsState([]);
    }
  }, [toast, user?.tenantId]);


  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin() || !user?.tenantId) {
        setAllUsersState([]); return;
    }
    try {
      // TODO: Update API to accept tenantId: /api/users?tenantId=${user.tenantId}
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users and could not parse error response.' }));
        throw new Error(errorData.message || 'Server error while fetching users.');
      }
      const usersData: UserProfile[] = await response.json();
      setAllUsersState(usersData.filter(u => u.tenantId === user.tenantId)); // Client-side filter for now
    } catch (error: any) {
      console.error("Failed to fetch users:", error.message);
      toast({ title: 'Error Loading Users', description: `Failed to retrieve user list from database. Detail: ${error.message}`, variant: 'destructive' });
      setAllUsersState([]);
    }
  }, [toast, isAdmin, user?.tenantId]);

  const fetchVisitorEntries = useCallback(async () => {
     // TODO: API needs to be tenant-aware
    if (!user?.tenantId && process.env.NODE_ENV !== 'development') { // Allow global fetch in dev for now
        setVisitorEntriesState([]); return;
    }
    try {
      // TODO: Update API to accept tenantId: /api/visitors?tenantId=${user.tenantId}
      const response = await fetch('/api/visitors');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch visitor entries and could not parse error response.' }));
        throw new Error(errorData.message || 'Server error while fetching visitor entries.');
      }
      const entriesData: VisitorEntry[] = await response.json();
      setVisitorEntriesState(entriesData);
    } catch (error: any) {
      console.error("Failed to fetch visitor entries:", error.message);
      toast({ title: 'Error Loading Visitor Entries', description: error.message, variant: 'destructive' });
      setVisitorEntriesState([]);
    }
  }, [toast, user?.tenantId]);

  const fetchGatePasses = useCallback(async () => {
    if (!user || !user.tenantId) {
        setGatePassesState([]); return;
    }
    try {
      // TODO: Update API to accept tenantId in some way, or ensure it only returns for the user's tenant
      const response = await fetch(`/api/gate-passes/user/${user.id}`); // This implicitly filters by user, assuming user belongs to one tenant
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch gate passes.' }));
        throw new Error(errorData.message || 'Server error while fetching gate passes.');
      }
      const passesData: GatePass[] = await response.json();
      setGatePassesState(passesData);
    } catch (error: any) {
      console.error("Failed to fetch gate passes:", error.message);
      toast({ title: 'Error Loading Gate Passes', description: error.message, variant: 'destructive' });
      setGatePassesState([]);
    }
  }, [user, toast]);

  const createGatePass = async (passData: Omit<GatePass, 'id' | 'tokenCode' | 'status' | 'createdAt' | 'updatedAt' | 'residentUserId' | 'residentFlatNumber' | 'tenantId'>): Promise<GatePass | null> => {
    if (!user || !user.flatNumber || !user.tenantId) {
      toast({ title: 'Error', description: 'User, flat number, or tenant ID missing.', variant: 'destructive' });
      return null;
    }
    const submissionData = {
        ...passData,
        residentUserId: user.id,
        residentFlatNumber: user.flatNumber,
        tenantId: user.tenantId,
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
    } catch (error: any) {
        toast({ title: 'Gate Pass Creation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        return null;
    }
  };

  const cancelGatePass = async (passId: string): Promise<boolean> => {
    // Assuming passId is globally unique, or API needs tenantId for lookup
    try {
        const response = await fetch(`/api/gate-passes/${passId}`, {
            method: 'DELETE',
            // TODO: If API needs tenantId for authorization: headers: { 'X-Tenant-ID': user?.tenantId }
        });
        const data = await response.json();
        if (!response.ok) {
            toast({ title: 'Gate Pass Cancellation Failed', description: data.message || 'Could not cancel pass.', variant: 'destructive' });
            return false;
        }
        toast({ title: 'Gate Pass Cancelled', description: `Pass ID ${passId} has been cancelled.` });
        await fetchGatePasses();
        return true;
    } catch (error: any) {
        toast({ title: 'Gate Pass Cancellation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        return false;
    }
  };

  const markGatePassUsed = async (passId: string, guardId: string): Promise<{visitorEntry: VisitorEntry, updatedPass: GatePass} | null> => {
    if (!user?.tenantId) {
         toast({ title: 'Error', description: 'Tenant ID missing for guard action.', variant: 'destructive' });
         return null;
    }
    try {
      const response = await fetch(`/api/gate-passes/${passId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: GATE_PASS_STATUSES.USED, markedUsedBy: guardId, tenantId: user.tenantId }), // Pass tenantId
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Gate Pass Update Failed', description: data.message || 'Could not mark pass as used.', variant: 'destructive' });
        return null;
      }
      if (user?.role !== USER_ROLES.GUARD) {
          await fetchGatePasses();
      }
      await fetchVisitorEntries(); // This needs to be tenant-aware
      return data;
    } catch (error: any) {
      toast({ title: 'Gate Pass Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const fetchGatePassByToken = async (tokenCode: string): Promise<GatePass | null> => {
    // TODO: API needs to search within a tenant or globally if tokens are globally unique
    if (!user?.tenantId && process.env.NODE_ENV !== 'development') {
        toast({ title: 'Error', description: 'Tenant ID required to search token.', variant: 'destructive' });
        return null;
    }
    try {
      // TODO: Update API: /api/gate-passes/by-token/${tokenCode}?tenantId=${user.tenantId}
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
    } catch (error: any) {
      console.error("Failed to fetch gate pass by token:", error);
      toast({ title: 'Error Fetching Pass', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const fetchMyComplaints = useCallback(async () => {
    if (!user || !user.tenantId || (!isOwnerOrRenter() && !isAdmin())) {
        setMyComplaintsState([]); return;
    }
    try {
      // API is already user-specific, user.id implicitly belongs to a tenant
      const response = await fetch(`/api/complaints/user/${user.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your complaints.' }));
        throw new Error(errorData.message || 'Server error while fetching your complaints.');
      }
      const complaintsData: Complaint[] = await response.json();
      setMyComplaintsState(complaintsData);
    } catch (error: any) {
      console.error("Failed to fetch my complaints:", error.message);
      toast({ title: 'Error Loading Complaints', description: error.message, variant: 'destructive' });
      setMyComplaintsState([]);
    }
  }, [user, toast, isOwnerOrRenter, isAdmin]);

  const fetchAllNoticesForAdmin = useCallback(async () => {
    if (!isAdmin() || !user?.tenantId) {
        setAllNoticesForAdminState([]); return;
    }
    try {
      // TODO: Update API: /api/notices/admin/all?tenantId=${user.tenantId}
      const response = await fetch('/api/notices/admin/all');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notices for admin.' }));
        throw new Error(errorData.message || 'Server error fetching admin notices.');
      }
      const noticesData: Notice[] = await response.json();
      setAllNoticesForAdminState(noticesData);
    } catch (error: any) {
      console.error("Failed to fetch all notices for admin:", error.message);
      toast({ title: 'Error Loading Admin Notices', description: error.message, variant: 'destructive' });
      setAllNoticesForAdminState([]);
    }
  }, [toast, isAdmin, user?.tenantId]);

  const fetchAllMeetingsForAdmin = useCallback(async () => {
    if (!isAdmin() || !user?.tenantId) {
        setAllMeetingsForAdminState([]); return;
    }
    try {
      // TODO: Update API: /api/meetings/admin/all?tenantId=${user.tenantId}
      const response = await fetch('/api/meetings/admin/all');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch meetings for admin.' }));
        throw new Error(errorData.message || 'Server error fetching admin meetings.');
      }
      const meetingsData: Meeting[] = await response.json();
      setAllMeetingsForAdminState(meetingsData);
    } catch (error: any) {
      console.error("Failed to fetch all meetings for admin:", error.message);
      toast({ title: 'Error Loading Admin Meetings', description: error.message, variant: 'destructive' });
      setAllMeetingsForAdminState([]);
    }
  }, [toast, isAdmin, user?.tenantId]);

  const fetchPendingVendors = useCallback(async () => {
    if (!isAdmin() || !user?.tenantId) {
      setPendingVendorsState([]); 
      return;
    }
    try {
      // TODO: Update API: /api/vendors/admin/pending?tenantId=${user.tenantId}
      const response = await fetch('/api/vendors/admin/pending');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch pending vendors.' }));
        throw new Error(errorData.message || 'Server error fetching pending vendors.');
      }
      const vendorsData: Vendor[] = await response.json();
      setPendingVendorsState(vendorsData);
    } catch (error: any) {
      console.error("Failed to fetch pending vendors:", error.message);
      setPendingVendorsState([]); 
    }
  }, [isAdmin, user?.tenantId]); 

  const fetchAllParkingSpots = useCallback(async () => { 
    if (!isAdmin() || !user?.tenantId) {
        setAllParkingSpotsState([]);
        return;
    }
    try {
      // TODO: Update API: /api/parking/spots?tenantId=${user.tenantId}
      const response = await fetch('/api/parking/spots');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch parking spots.' }));
        throw new Error(errorData.message || 'Server error fetching parking spots.');
      }
      const spots: ParkingSpot[] = await response.json();
      setAllParkingSpotsState(spots);
    } catch (error: any) {
      console.error("Failed to fetch all parking spots:", error.message);
      toast({ title: 'Error Loading Parking Spots', description: error.message, variant: 'destructive' });
      setAllParkingSpotsState([]);
    }
  }, [isAdmin, toast, user?.tenantId]);

  const fetchMyParkingSpots = useCallback(async () => { 
    if (!user || !isOwnerOrRenter() || !user.tenantId) {
      setMyParkingSpotsState([]);
      return;
    }
    try {
      // API is user-specific, user implies tenant
      const response = await fetch(`/api/parking/my-spots?userId=${user.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your parking spots.' }));
        throw new Error(errorData.message || 'Server error fetching your parking spots.');
      }
      const spots: ParkingSpot[] = await response.json();
      setMyParkingSpotsState(spots);
    } catch (error: any) {
      console.error("Failed to fetch my parking spots:", error.message);
      toast({ title: 'Error Loading Your Parking Spots', description: error.message, variant: 'destructive' });
      setMyParkingSpotsState([]);
    }
  }, [user, isOwnerOrRenter, toast]);

  const fetchFacilities = useCallback(async () => {
    if (!user?.tenantId && process.env.NODE_ENV !== 'development') {
        setFacilitiesState([]); return;
    }
    try {
      // TODO: Update API: /api/facilities?tenantId=${user.tenantId}
      const response = await fetch('/api/facilities');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch facilities.' }));
        throw new Error(errorData.message || 'Server error while fetching facilities.');
      }
      const facilitiesData: Facility[] = await response.json();
      setFacilitiesState(facilitiesData);
    } catch (error: any) {
      console.error("Failed to fetch facilities:", error.message);
      toast({ title: 'Error Loading Facilities', description: error.message, variant: 'destructive' });
      setFacilitiesState([]);
    }
  }, [toast, user?.tenantId]);


  const initialDataFetch = useCallback(async (currentUser: UserProfile | null) => {
    if (!currentUser || !currentUser.tenantId) {
      console.warn("Initial data fetch skipped: no user or tenantId.");
      return;
    }
    setIsFetchingInitialData(true);
    // All these fetches need to become tenant-aware
    const commonFetches = [
      fetchSocietyInfo(), // API needs tenantId or be designed for it
      _fetchActiveNotices(),
      _fetchUpcomingMeetings(),
      _fetchApprovedVendors(),
      _fetchCommitteeMembers(),
      fetchSocietyPaymentDetails(),
      _fetchApprovedResidents(),
      fetchVisitorEntries(),
      fetchFacilities(),
    ];

    const roleSpecificFetches = [];
    if (currentUser.role === USER_ROLES.SUPERADMIN) {
        roleSpecificFetches.push(fetchAllUsers());
        roleSpecificFetches.push(fetchAllNoticesForAdmin());
        roleSpecificFetches.push(fetchAllMeetingsForAdmin());
        roleSpecificFetches.push(fetchPendingVendors());
        roleSpecificFetches.push(fetchAllParkingSpots());
    }
    if (currentUser.role === USER_ROLES.OWNER || currentUser.role === USER_ROLES.RENTER) {
        roleSpecificFetches.push(fetchMyComplaints());
        roleSpecificFetches.push(fetchMyParkingSpots());
    }
    // Gate passes are fetched if user is owner, renter, or admin (admin might see all for a tenant later)
    if (currentUser.role === USER_ROLES.OWNER || currentUser.role === USER_ROLES.RENTER || currentUser.role === USER_ROLES.SUPERADMIN) {
         roleSpecificFetches.push(fetchGatePasses());
    }
    
    try {
        await Promise.all([...commonFetches, ...roleSpecificFetches]);
    } catch (error) {
        console.error("Error during initial data fetch batch:", error);
        // Individual fetch functions already show toasts for their specific errors
    } finally {
        setIsFetchingInitialData(false);
    }
  }, [
      fetchSocietyInfo, _fetchActiveNotices, _fetchUpcomingMeetings, _fetchApprovedVendors, _fetchCommitteeMembers,
      fetchSocietyPaymentDetails, _fetchApprovedResidents, fetchVisitorEntries, fetchFacilities,
      fetchAllUsers, fetchAllNoticesForAdmin, fetchAllMeetingsForAdmin, fetchPendingVendors,
      fetchMyComplaints, fetchGatePasses, fetchAllParkingSpots, fetchMyParkingSpots
  ]);

   useEffect(() => {
    setIsLoadingUser(true);
    // Here you would typically check for an existing session (e.g., from localStorage, cookie)
    // For this app, we don't have session persistence beyond page refresh.
    // So, if `user` is null, we assume no one is logged in.
    // If `user` is populated (e.g., after login), then initialDataFetch is triggered.
    if (user) {
        initialDataFetch(user).finally(() => setIsLoadingUser(false));
    } else {
        setIsLoadingUser(false); // No user, no session to check
    }
  }, [user, initialDataFetch]);


  const login = async (email: string, passwordString: string): Promise<boolean> => {
    setIsLoadingUser(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordString }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Login Failed', description: data.message || 'Invalid credentials.', variant: 'destructive' });
        setUser(null);
        return false;
      }

      const loggedInUser = data as UserProfile;
       if (!loggedInUser.tenantId) {
        toast({ title: 'Login Failed', description: 'Tenant information missing for this user.', variant: 'destructive' });
        setUser(null);
        return false;
      }
      if ((loggedInUser.role === USER_ROLES.OWNER || loggedInUser.role === USER_ROLES.RENTER || loggedInUser.role === USER_ROLES.GUARD) && !loggedInUser.isApproved) {
        toast({ title: 'Login Failed', description: 'Your account is pending approval.', variant: 'destructive' });
        setUser(null);
        return false;
      }

      setUser(loggedInUser); // This will trigger the useEffect for initialDataFetch
      toast({ title: 'Login Successful', description: `Welcome back, ${loggedInUser.name}!` });
      router.push('/dashboard');
      return true;
    } catch (error: any) {
      toast({ title: 'Login Error', description: error.message || 'An unexpected error occurred during login.', variant: 'destructive' });
      setUser(null);
      return false;
    } finally {
      // setIsLoadingUser(false); // isLoadingUser will be set by the useEffect watching `user`
    }
  };

  const logout = () => {
    setUser(null); // This will trigger the useEffect for initialDataFetch with null user
    // Clear all fetched data states
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
    setSocietyInfoState(null);
    setApprovedResidentsState([]);
    setAllParkingSpotsState([]);
    setMyParkingSpotsState([]);
    setFacilitiesState([]);

    router.push('/');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'registrationDate' | 'password' | 'tenantId'> & {password: string, role: Exclude<UserRole, "superadmin">, societyName: string}): Promise<boolean> => {
    setIsLoadingUser(true);
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
      router.push('/'); // Redirect to login/home after registration
      return true;
    } catch (error: any) {
      toast({ title: 'Registration Error', description: error.message || 'An unexpected error occurred during registration.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoadingUser(false);
    }
  };

  const approveResident = async (userId: string): Promise<boolean> => {
     if (!user?.tenantId) return false; // Admin needs tenant context
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': user.tenantId }, // Pass tenantId for context
        body: JSON.stringify({ isApproved: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Approval Failed', description: data.message || 'Could not approve user.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'User Approved', description: `${data.name} (${data.role}) has been approved.` });
      await fetchAllUsers(); // Refresh user list for the current tenant
      await _fetchApprovedResidents(); 
      return true;
    } catch (error: any) {
      toast({ title: 'Approval Error', description: error.message || 'An unexpected error occurred during approval.', variant: 'destructive' });
      return false;
    }
  };

  const rejectUser = async (userId: string): Promise<boolean> => {
    if (!user?.tenantId) return false;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
         headers: { 'X-Tenant-ID': user.tenantId }, // Pass tenantId for context
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to reject user.' }));
        toast({ title: 'Rejection Failed', description: data.message || 'Could not reject user.', variant: 'destructive' });
        return false;
      }
      const data = await response.json();
      toast({ title: 'User Rejected', description: `Registration for ${data.name} has been rejected and removed.` });
      await fetchAllUsers(); // Refresh user list for the current tenant
      await _fetchApprovedResidents(); 
      return true;
    } catch (error: any) {
      toast({ title: 'Rejection Error', description: error.message || 'An unexpected error occurred during rejection.', variant: 'destructive' });
      return false;
    }
  };

  const updateUserProfile = async (userId: string, updates: { name?: string; secondaryPhoneNumber1?: string; secondaryPhoneNumber2?: string }): Promise<UserProfile | null> => {
    if (!user?.tenantId) return null;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': user.tenantId },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Profile Update Failed', description: data.message || 'Could not update profile.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });

      if (user && user.id === userId) { // Update current user's context
        setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
      }
      if (isAdmin()) {
        await fetchAllUsers(); // Refresh full list if admin
      }
      await _fetchApprovedResidents(); 
      return data as UserProfile;
    } catch (error: any) {
      toast({ title: 'Profile Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user?.tenantId) return false;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': user.tenantId },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Password Change Failed', description: data.message || 'Could not change password.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Password Changed', description: 'Your password has been successfully changed.' });
      return true;
    } catch (error: any) {
      toast({ title: 'Password Change Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'status' | 'userId' | 'userName' | 'userFlatNumber' | 'tenantId'>): Promise<Complaint | null> => {
    if (!user || !user.flatNumber || !user.tenantId) {
      toast({ title: 'Error', description: 'User context (flat, tenant) missing.', variant: 'destructive' });
      return null;
    }
    const submissionData = {
      ...complaintData,
      userId: user.id,
      userName: user.name,
      userFlatNumber: user.flatNumber,
      tenantId: user.tenantId,
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
    } catch (error: any) {
      toast({ title: 'Complaint Submission Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const createNotice = async (noticeData: { title: string; content: string; }): Promise<Notice | null> => {
    if (!user || !isAdmin() || !user.tenantId) {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
        return null;
    }
    const submissionData = {
        ...noticeData,
        postedByUserId: user.id,
        postedByName: user.name,
        tenantId: user.tenantId,
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
        await _fetchActiveNotices();
        if (isAdmin()) await fetchAllNoticesForAdmin();
        return data as Notice;
    } catch (error: any) {
        toast({ title: 'Notice Creation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        return null;
    }
  };

  const updateNotice = async (noticeId: string, currentMonthYear: string, updates: Partial<Omit<Notice, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt' | 'tenantId'>>): Promise<Notice | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': user.tenantId },
        body: JSON.stringify({ ...updates, monthYear: currentMonthYear }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Notice Update Failed', description: data.message || 'Could not update notice.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Notice Updated', description: `Notice "${data.title}" has been updated.` });
      await _fetchActiveNotices();
      await fetchAllNoticesForAdmin();
      return data as Notice;
    } catch (error: any) {
      toast({ title: 'Notice Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const deleteNotice = async (noticeId: string, currentMonthYear: string): Promise<boolean> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/notices/${noticeId}?monthYear=${encodeURIComponent(currentMonthYear)}&tenantId=${user.tenantId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete notice.' }));
        toast({ title: 'Notice Deletion Failed', description: data.message || 'Could not delete notice.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Notice Deleted', description: 'The notice has been successfully deleted.' });
      await _fetchActiveNotices();
      await fetchAllNoticesForAdmin();
      return true;
    } catch (error: any) {
      toast({ title: 'Notice Deletion Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const createMeeting = async (meetingData: Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'isActive' | 'monthYear' | 'updatedAt' | 'tenantId'>): Promise<Meeting | null> => {
    if (!user || !isAdmin() || !user.tenantId) {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
        return null;
    }
    const submissionData = {
        ...meetingData,
        postedByUserId: user.id,
        postedByName: user.name,
        tenantId: user.tenantId,
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
        await _fetchUpcomingMeetings();
        if (isAdmin()) await fetchAllMeetingsForAdmin();
        return data as Meeting;
    } catch (error: any) {
        toast({ title: 'Meeting Creation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        return null;
    }
  };

  const updateMeeting = async (meetingId: string, currentMonthYear: string, updates: Partial<Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt' | 'tenantId'>>): Promise<Meeting | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    const body = { ...updates, monthYear: currentMonthYear, tenantId: user.tenantId }; // Ensure tenantId is part of the update payload if needed by API
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' , 'X-Tenant-ID': user.tenantId},
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Meeting Update Failed', description: data.message || 'Could not update meeting.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Meeting Updated', description: `Meeting "${data.title}" has been updated.` });
      await _fetchUpcomingMeetings();
      await fetchAllMeetingsForAdmin();
      return data as Meeting;
    } catch (error: any) {
      toast({ title: 'Meeting Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const deleteMeeting = async (meetingId: string, currentMonthYear: string): Promise<boolean> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/meetings/${meetingId}?monthYear=${encodeURIComponent(currentMonthYear)}&tenantId=${user.tenantId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete meeting.' }));
        toast({ title: 'Meeting Deletion Failed', description: data.message || 'Could not delete meeting.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Meeting Deleted', description: 'The meeting has been successfully deleted.' });
      await _fetchUpcomingMeetings();
      await fetchAllMeetingsForAdmin();
      return true;
    } catch (error: any) {
      toast({ title: 'Meeting Deletion Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const submitNewVendor = async (vendorData: Omit<Vendor, 'id' | 'submittedAt' | 'isApproved' | 'submittedByUserId' | 'submittedByName' | 'approvedByUserId' | 'approvedAt' | 'tenantId'>): Promise<Vendor | null> => {
    if (!user || !user.tenantId) {
      toast({ title: 'Error', description: 'User context or tenant missing.', variant: 'destructive' });
      return null;
    }
    const submissionData = {
      ...vendorData,
      submittedByUserId: user.id,
      submittedByName: user.name,
      tenantId: user.tenantId,
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
      return data as Vendor; // Toast handled by calling component or page
    } catch (error: any) {
      toast({ title: 'Vendor Submission Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const approveVendor = async (vendorId: string): Promise<Vendor | null> => {
    if (!user || !isAdmin() || !user.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch(`/api/vendors/admin/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': user.tenantId },
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
      await _fetchApprovedVendors();
      return data as Vendor;
    } catch (error: any) {
      toast({ title: 'Vendor Approval Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const rejectVendor = async (vendorId: string): Promise<boolean> => {
     if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/vendors/admin/${vendorId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-ID': user.tenantId },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to reject vendor.' }));
        toast({ title: 'Vendor Rejection Failed', description: data.message || 'Could not reject vendor submission.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Vendor Rejected', description: 'The vendor submission has been successfully rejected and removed.' });
      await fetchPendingVendors();
      return true;
    } catch (error: any) {
      toast({ title: 'Vendor Rejection Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const addCommitteeMember = async (memberData: Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>): Promise<CommitteeMember | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    const submissionData = { ...memberData, tenantId: user.tenantId };
    try {
      const response = await fetch('/api/committee-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Failed to Add Member', description: data.message || 'Could not add committee member.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Member Added', description: `${data.name} has been added to the committee.` });
      await _fetchCommitteeMembers();
      return data as CommitteeMember;
    } catch (error: any) {
      toast({ title: 'Error Adding Member', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const updateCommitteeMember = async (memberId: string, memberData: Partial<Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<CommitteeMember | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch(`/api/committee-members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': user.tenantId },
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Failed to Update Member', description: data.message || 'Could not update committee member.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Member Updated', description: `${data.name}'s details have been updated.` });
      await _fetchCommitteeMembers();
      return data as CommitteeMember;
    } catch (error: any) {
      toast({ title: 'Error Updating Member', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const deleteCommitteeMember = async (memberId: string): Promise<boolean> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/committee-members/${memberId}?tenantId=${user.tenantId}`, { // Pass tenantId for auth on API
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete member.'}));
        toast({ title: 'Failed to Delete Member', description: data.message || 'Could not delete committee member.', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Member Deleted', description: 'The committee member has been removed.' });
      await _fetchCommitteeMembers();
      return true;
    } catch (error: any) {
      toast({ title: 'Error Deleting Member', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const updateSocietyPaymentDetails = async (details: Omit<SocietyPaymentDetails, 'id' | 'updatedAt' | 'tenantId'>): Promise<SocietyPaymentDetails | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    const submissionData = { ...details, tenantId: user.tenantId };
    try {
      const response = await fetch('/api/settings/payment-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Update Failed', description: data.message || 'Could not update payment details.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Payment Details Updated', description: 'Society payment details have been updated.' });
      setSocietyPaymentDetailsState(data as SocietyPaymentDetails);
      return data as SocietyPaymentDetails;
    } catch (error: any) {
      toast({ title: 'Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };
  
  const updateSocietyInfo = async (settings: Omit<SocietyInfoSettings, 'id' | 'updatedAt' | 'tenantId'>): Promise<SocietyInfoSettings | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    const submissionData = { ...settings, tenantId: user.tenantId };
    try {
      const response = await fetch('/api/settings/society-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Update Failed', description: data.message || 'Could not update society information.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Society Info Updated', description: 'Society information has been successfully updated.' });
      setSocietyInfoState(data as SocietyInfoSettings);
      return data as SocietyInfoSettings;
    } catch (error: any) {
      toast({ title: 'Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      return null;
    }
  };

  const createParkingSpot = async (spotData: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tenantId'>): Promise<ParkingSpot | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    const submissionData = { ...spotData, tenantId: user.tenantId };
    try {
      const response = await fetch('/api/parking/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Parking Spot Creation Failed', description: data.message || 'Could not create spot.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Parking Spot Created', description: `Spot ${data.spotNumber} created.` });
      await fetchAllParkingSpots();
      return data as ParkingSpot;
    } catch (error: any) {
      toast({ title: 'Parking Spot Creation Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateParkingSpot = async (spotId: string, updates: Partial<Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<ParkingSpot | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch(`/api/parking/spots/${spotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': user.tenantId },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Parking Spot Update Failed', description: data.message || 'Could not update spot.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Parking Spot Updated', description: `Spot ${data.spotNumber} updated.` });
      await fetchAllParkingSpots();
      await fetchMyParkingSpots(); 
      return data as ParkingSpot;
    } catch (error: any) {
      toast({ title: 'Parking Spot Update Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteParkingSpot = async (spotId: string): Promise<boolean> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/parking/spots/${spotId}?tenantId=${user.tenantId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete spot.' }));
        toast({ title: 'Parking Spot Deletion Failed', description: data.message, variant: 'destructive' });
        return false;
      }
      toast({ title: 'Parking Spot Deleted', description: `Spot ${spotId} deleted.` });
      await fetchAllParkingSpots();
      await fetchMyParkingSpots(); 
      return true;
    } catch (error: any) {
      toast({ title: 'Parking Spot Deletion Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const createFacility = async (facilityData: Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'tenantId'>): Promise<Facility | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    const submissionData = { ...facilityData, tenantId: user.tenantId };
    try {
      const response = await fetch('/api/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Facility Creation Failed', description: data.message || 'Could not create facility.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Facility Created', description: `Facility "${data.name}" has been added.` });
      await fetchFacilities(); 
      return data as Facility;
    } catch (error: any) {
      toast({ title: 'Facility Creation Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateFacility = async (facilityId: string, updates: Partial<Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<Facility | null> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return null;
    }
    try {
      const response = await fetch(`/api/facilities/${facilityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': user.tenantId },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Facility Update Failed', description: data.message || 'Could not update facility.', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Facility Updated', description: `Facility "${data.name}" has been updated.` });
      await fetchFacilities();
      return data as Facility;
    } catch (error: any) {
      toast({ title: 'Facility Update Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteFacility = async (facilityId: string): Promise<boolean> => {
    if (!isAdmin() || !user?.tenantId) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return false;
    }
    try {
      const response = await fetch(`/api/facilities/${facilityId}?tenantId=${user.tenantId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete facility.' }));
        toast({ title: 'Facility Deletion Failed', description: data.message, variant: 'destructive' });
        return false;
      }
      toast({ title: 'Facility Deleted', description: 'The facility has been successfully deleted.' });
      await fetchFacilities();
      return true;
    } catch (error: any) {
      toast({ title: 'Facility Deletion Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };


  return (
    <AuthContext.Provider value={{
        user,
        isLoading,
        isLoadingUser,
        isFetchingInitialData,
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
        societyInfo,
        fetchSocietyInfo,
        updateSocietyInfo,
        approvedResidents,
        fetchApprovedResidents,
        allParkingSpots,
        fetchAllParkingSpots,
        myParkingSpots,
        fetchMyParkingSpots,
        createParkingSpot,
        updateParkingSpot,
        deleteParkingSpot,
        facilities,
        fetchFacilities,
        createFacility,
        updateFacility,
        deleteFacility,
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
