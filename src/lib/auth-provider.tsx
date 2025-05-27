
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserProfile, VisitorEntry, GatePass, UserRole, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails, NeighbourProfile, ParkingSpot, SocietyInfoSettings, Facility, Society } from './types';
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
  register: (userData: Omit<User, 'id' | 'isApproved' | 'registrationDate' | 'password' | 'tenantId'> & {password: string, role: Exclude<UserRole, "superadmin" | "societyAdmin">, societyId: string}) => Promise<boolean>;
  approveResident: (userId: string) => Promise<boolean>;
  rejectUser: (userId: string) => Promise<boolean>;
  updateUserProfile: (userId: string, updates: { name?: string; secondaryPhoneNumber1?: string; secondaryPhoneNumber2?: string }) => Promise<UserProfile | null>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  isAdmin: () => boolean;
  isSocietyAdmin: () => boolean;
  isOwnerOrRenter: () => boolean;
  isGuard: () => boolean;
  allUsers: UserProfile[];
  fetchAllUsers: () => Promise<void>;
  visitorEntries: VisitorEntry[];
  fetchVisitorEntries: () => Promise<void>;
  gatePasses: GatePass[];
  fetchGatePasses: () => Promise<void>;
  createGatePass: (passData: Omit<GatePass, 'id' | 'tokenCode' | 'status' | 'createdAt' | 'updatedAt' | 'residentUserId' | 'residentFlatNumber' | 'societyId'>) => Promise<GatePass | null>;
  cancelGatePass: (passId: string) => Promise<boolean>;
  markGatePassUsed: (passId: string, guardId: string) => Promise<{visitorEntry: VisitorEntry, updatedPass: GatePass} | null>;
  fetchGatePassByToken: (tokenCode: string) => Promise<GatePass | null>;
  myComplaints: Complaint[];
  submitComplaint: (complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'status' | 'userId' | 'userName' | 'userFlatNumber' | 'societyId'>) => Promise<Complaint | null>;
  fetchMyComplaints: () => Promise<void>;
  activeNotices: Notice[];
  fetchActiveNotices: () => Promise<void>;
  createNotice: (noticeData: { title: string; content: string; }) => Promise<Notice | null>;
  allNoticesForAdmin: Notice[];
  fetchAllNoticesForAdmin: () => Promise<void>;
  updateNotice: (noticeId: string, currentMonthYear: string, updates: Partial<Omit<Notice, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt' | 'societyId'>>) => Promise<Notice | null>;
  deleteNotice: (noticeId: string, currentMonthYear: string) => Promise<boolean>;
  upcomingMeetings: Meeting[];
  fetchUpcomingMeetings: () => Promise<void>;
  createMeeting: (meetingData: Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'isActive' | 'monthYear' | 'updatedAt' | 'societyId'>) => Promise<Meeting | null>;
  allMeetingsForAdmin: Meeting[];
  fetchAllMeetingsForAdmin: () => Promise<void>;
  updateMeeting: (meetingId: string, currentMonthYear: string, updates: Partial<Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt' | 'societyId'>>) => Promise<Meeting | null>;
  deleteMeeting: (meetingId: string, currentMonthYear: string) => Promise<boolean>;
  approvedVendors: Vendor[];
  fetchApprovedVendors: () => Promise<void>;
  submitNewVendor: (vendorData: Omit<Vendor, 'id' | 'submittedAt' | 'isApproved' | 'submittedByUserId' | 'submittedByName' | 'approvedByUserId' | 'approvedAt' | 'societyId'>) => Promise<Vendor | null>;
  pendingVendors: Vendor[];
  fetchPendingVendors: () => Promise<void>;
  approveVendor: (vendorId: string) => Promise<Vendor | null>;
  rejectVendor: (vendorId: string) => Promise<boolean>;
  committeeMembers: CommitteeMember[];
  fetchCommitteeMembers: () => Promise<void>;
  addCommitteeMember: (memberData: Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt' | 'societyId'>) => Promise<CommitteeMember | null>;
  updateCommitteeMember: (memberId: string, memberData: Partial<Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt' | 'societyId'>>) => Promise<CommitteeMember | null>;
  deleteCommitteeMember: (memberId: string) => Promise<boolean>;
  societyPaymentDetails: SocietyPaymentDetails | null;
  fetchSocietyPaymentDetails: () => Promise<void>;
  updateSocietyPaymentDetails: (details: Omit<SocietyPaymentDetails, 'id' | 'updatedAt' | 'societyId'>) => Promise<SocietyPaymentDetails | null>;
  societyInfo: SocietyInfoSettings | null;
  fetchSocietyInfo: () => Promise<void>;
  updateSocietyInfo: (settings: Omit<SocietyInfoSettings, 'id' | 'updatedAt' | 'societyId'>) => Promise<SocietyInfoSettings | null>;
  approvedResidents: NeighbourProfile[];
  fetchApprovedResidents: () => Promise<void>;
  allParkingSpots: ParkingSpot[];
  fetchAllParkingSpots: () => Promise<void>;
  myParkingSpots: ParkingSpot[];
  fetchMyParkingSpots: () => Promise<void>;
  createParkingSpot: (spotData: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'societyId'>) => Promise<ParkingSpot | null>;
  updateParkingSpot: (spotId: string, updates: Partial<Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'societyId'>>) => Promise<ParkingSpot | null>;
  deleteParkingSpot: (spotId: string) => Promise<boolean>;
  facilities: Facility[];
  fetchFacilities: () => Promise<void>;
  createFacility: (facilityData: Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'societyId'>) => Promise<Facility | null>;
  updateFacility: (facilityId: string, updates: Partial<Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'societyId'>>) => Promise<Facility | null>;
  deleteFacility: (facilityId: string) => Promise<boolean>;
  initialDataFetch: (currentUser: UserProfile | null) => Promise<void>;
  activeSocietiesList: Pick<Society, 'id' | 'name' | 'city'>[];
  fetchActiveSocietiesList: () => Promise<Pick<Society, 'id' | 'name' | 'city'>[]>;
  createSociety: (societyData: { name: string; city: string }) => Promise<Society | null>;
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
  const [activeSocietiesList, setActiveSocietiesListState] = useState<Pick<Society, 'id' | 'name' | 'city'>[]>([]);


  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(false);
  const isLoading = isLoadingUser || isFetchingInitialData;

  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = useCallback(() => user?.role === USER_ROLES.SUPERADMIN, [user]);
  const isSocietyAdmin = useCallback(() => user?.role === USER_ROLES.SOCIETY_ADMIN, [user]);
  const isOwnerOrRenter = useCallback(() => user?.role === USER_ROLES.OWNER || user?.role === USER_ROLES.RENTER, [user]);
  const isGuard = useCallback(() => user?.role === USER_ROLES.GUARD, [user]);

  const fetchActiveSocietiesList = useCallback(async (): Promise<Pick<Society, 'id' | 'name' | 'city'>[]> => {
    try {
      const response = await fetch('/api/societies'); // Changed from /api/societies/active-list
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch societies list.' }));
        throw new Error(errorData.message || 'Server error fetching societies.');
      }
      const societies: Pick<Society, 'id' | 'name' | 'city'>[] = await response.json();
      setActiveSocietiesListState(societies);
      return societies;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Societies', description: error.message, variant: 'destructive' });
      }
      setActiveSocietiesListState([]);
      return [];
    }
  }, [toast]);

  const createSociety = useCallback(async (societyData: { name: string; city: string }): Promise<Society | null> => {
    if (!isAdmin()) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Only Super Admins can create societies.', variant: 'destructive' });
      }
      return null;
    }
    try {
      const response = await fetch('/api/societies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(societyData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Society Creation Failed', description: data.message || 'Could not create society.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Society Created', description: `Society "${data.name}" has been created successfully.` });
      }
      await fetchActiveSocietiesList(); // Refresh the list
      return data as Society;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Society Creation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  }, [isAdmin, toast, fetchActiveSocietiesList]);


  const fetchSocietyInfo = useCallback(async () => {
    if (!user?.societyId) { // Now uses societyId
      setSocietyInfoState(null);
      return;
    }
    try {
      const response = await fetch(`/api/settings/society-info?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch society info.' }));
        throw new Error(errorData.message || 'Server error fetching society info.');
      }
      const info: SocietyInfoSettings = await response.json();
      setSocietyInfoState(info);
    } catch (error: any) {
      console.error("Failed to fetch society info:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Society Info', description: error.message, variant: 'destructive' });
      }
      setSocietyInfoState(null);
    }
  }, [user?.societyId, toast]);

  const fetchActiveNotices = useCallback(async () => {
    if (!user?.societyId) {
      setActiveNoticesState([]);
      return;
    }
    try {
      const response = await fetch(`/api/notices?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch active notices.' }));
        throw new Error(errorData.message || 'Server error while fetching active notices.');
      }
      const noticesData: Notice[] = await response.json();
      setActiveNoticesState(noticesData);
    } catch (error: any) {
      console.error("Failed to fetch active notices:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Announcements', description: error.message, variant: 'destructive' });
      }
      setActiveNoticesState([]);
    }
  }, [user?.societyId, toast]);

  const fetchUpcomingMeetings = useCallback(async () => {
    if (!user?.societyId) {
      setUpcomingMeetingsState([]);
      return;
    }
    try {
      const response = await fetch(`/api/meetings?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch upcoming meetings.' }));
        throw new Error(errorData.message || 'Server error while fetching upcoming meetings.');
      }
      const meetingsData: Meeting[] = await response.json();
      setUpcomingMeetingsState(meetingsData);
    } catch (error: any) {
      console.error("Failed to fetch upcoming meetings:", error.message);
       if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Meetings', description: error.message, variant: 'destructive' });
      }
      setUpcomingMeetingsState([]);
    }
  }, [user?.societyId, toast]);

  const fetchApprovedVendors = useCallback(async () => {
    if (!user?.societyId) {
      setApprovedVendorsState([]);
      return;
    }
    try {
      const response = await fetch(`/api/vendors?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch approved vendors.' }));
        throw new Error(errorData.message || 'Server error while fetching approved vendors.');
      }
      const vendorsData: Vendor[] = await response.json();
      setApprovedVendorsState(vendorsData);
    } catch (error: any) {
      console.error("Failed to fetch approved vendors:", error.message);
       if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Vendor Directory', description: error.message, variant: 'destructive' });
      }
      setApprovedVendorsState([]);
    }
  }, [user?.societyId, toast]);

  const fetchCommitteeMembers = useCallback(async () => {
    if (!user?.societyId) {
       setCommitteeMembersState([]);
       return;
    }
    try {
      const response = await fetch(`/api/committee-members?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch committee members.' }));
        throw new Error(errorData.message || 'Server error while fetching committee members.');
      }
      const membersData: CommitteeMember[] = await response.json();
      setCommitteeMembersState(membersData);
    } catch (error: any) {
      console.error("Failed to fetch committee members:", error.message);
       if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Committee Members', description: error.message, variant: 'destructive' });
      }
      setCommitteeMembersState([]);
    }
  }, [user?.societyId, toast]);

  const fetchSocietyPaymentDetails = useCallback(async () => {
    if (!user?.societyId) {
        setSocietyPaymentDetailsState(null); return;
    }
    try {
      const response = await fetch(`/api/settings/payment-details?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch payment details.' }));
        throw new Error(errorData.message || 'Server error while fetching payment details.');
      }
      const details: SocietyPaymentDetails = await response.json();
      setSocietyPaymentDetailsState(details);
    } catch (error: any) {
      console.error("Failed to fetch society payment details:", error.message);
       if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Payment Details', description: error.message, variant: 'destructive' });
      }
      setSocietyPaymentDetailsState(null);
    }
  }, [user?.societyId, toast]);

  const fetchApprovedResidents = useCallback(async () => {
    if (!user?.societyId) {
       setApprovedResidentsState([]);
       return;
    }
    try {
      const response = await fetch(`/api/users/residents?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch approved residents and could not parse error response from server.' }));
        throw new Error(errorData.message || 'Server error while fetching approved residents.');
      }
      const residentsData: NeighbourProfile[] = await response.json();
      setApprovedResidentsState(residentsData);
    } catch (error: any) {
      console.error("Failed to fetch approved residents:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Residents Directory', description: error.message, variant: 'destructive' });
      }
      setApprovedResidentsState([]);
    }
  }, [user?.societyId, toast]);

  const fetchAllUsers = useCallback(async () => {
    if (!user?.societyId || (!isAdmin() && !isSocietyAdmin())) {
        setAllUsersState([]); return;
    }
    try {
      const response = await fetch(`/api/users?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users and could not parse error response.' }));
        throw new Error(errorData.message || 'Server error while fetching users.');
      }
      const usersData: UserProfile[] = await response.json();
      setAllUsersState(usersData);
    } catch (error: any) {
      console.error("Failed to fetch users:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Users', description: `Failed to retrieve user list from database. Detail: ${error.message}`, variant: 'destructive' });
      }
      setAllUsersState([]);
    }
  }, [user?.societyId, isAdmin, isSocietyAdmin, toast]);

  const fetchVisitorEntries = useCallback(async () => {
    if (!user?.societyId) {
        setVisitorEntriesState([]);
        return;
    }
    try {
      const response = await fetch(`/api/visitors?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch visitor entries and could not parse error response.' }));
        throw new Error(errorData.message || 'Server error while fetching visitor entries.');
      }
      const entriesData: VisitorEntry[] = await response.json();
      setVisitorEntriesState(entriesData);
    } catch (error: any) {
      console.error("Failed to fetch visitor entries:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Visitor Entries', description: error.message, variant: 'destructive' });
      }
      setVisitorEntriesState([]);
    }
  }, [user?.societyId, toast]);

  const fetchGatePasses = useCallback(async () => {
    if (!user || !user.societyId) {
        setGatePassesState([]); return;
    }
    try {
      const response = await fetch(`/api/gate-passes/user/${user.id}?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch gate passes.' }));
        throw new Error(errorData.message || 'Server error while fetching gate passes.');
      }
      const passesData: GatePass[] = await response.json();
      setGatePassesState(passesData);
    } catch (error: any) {
      console.error("Failed to fetch gate passes:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Gate Passes', description: error.message, variant: 'destructive' });
      }
      setGatePassesState([]);
    }
  }, [user, toast]);

  const fetchMyComplaints = useCallback(async () => {
    if (!user || !user.societyId || (!isOwnerOrRenter() && !isAdmin() && !isSocietyAdmin())) { // Admins can also see complaints
        setMyComplaintsState([]); return;
    }
    try {
      const response = await fetch(`/api/complaints/user/${user.id}?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your complaints.' }));
        throw new Error(errorData.message || 'Server error while fetching your complaints.');
      }
      const complaintsData: Complaint[] = await response.json();
      setMyComplaintsState(complaintsData);
    } catch (error: any) {
      console.error("Failed to fetch my complaints:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Complaints', description: error.message, variant: 'destructive' });
      }
      setMyComplaintsState([]);
    }
  }, [user, isOwnerOrRenter, isAdmin, isSocietyAdmin, toast]);

  const fetchAllNoticesForAdmin = useCallback(async () => {
    if (!user?.societyId || (!isAdmin() && !isSocietyAdmin())) {
        setAllNoticesForAdminState([]); return;
    }
    try {
      const response = await fetch(`/api/notices/admin/all?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notices for admin.' }));
        throw new Error(errorData.message || 'Server error fetching admin notices.');
      }
      const noticesData: Notice[] = await response.json();
      setAllNoticesForAdminState(noticesData);
    } catch (error: any) {
      console.error("Failed to fetch all notices for admin:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Admin Notices', description: error.message, variant: 'destructive' });
      }
      setAllNoticesForAdminState([]);
    }
  }, [user?.societyId, isAdmin, isSocietyAdmin, toast]);

  const fetchAllMeetingsForAdmin = useCallback(async () => {
    if (!user?.societyId || (!isAdmin() && !isSocietyAdmin())) {
        setAllMeetingsForAdminState([]); return;
    }
    try {
      const response = await fetch(`/api/meetings/admin/all?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch meetings for admin.' }));
        throw new Error(errorData.message || 'Server error fetching admin meetings.');
      }
      const meetingsData: Meeting[] = await response.json();
      setAllMeetingsForAdminState(meetingsData);
    } catch (error: any) {
      console.error("Failed to fetch all meetings for admin:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Admin Meetings', description: error.message, variant: 'destructive' });
      }
      setAllMeetingsForAdminState([]);
    }
  }, [user?.societyId, isAdmin, isSocietyAdmin, toast]);

  const fetchPendingVendors = useCallback(async () => {
    if (!user?.societyId || (!isAdmin() && !isSocietyAdmin())) {
      setPendingVendorsState([]);
      return;
    }
    try {
      const response = await fetch(`/api/vendors/admin/pending?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch pending vendors.' }));
        throw new Error(errorData.message || 'Server error fetching pending vendors.');
      }
      const vendorsData: Vendor[] = await response.json();
      setPendingVendorsState(vendorsData);
    } catch (error: any) {
      console.error("Failed to fetch pending vendors:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Pending Vendors', description: error.message, variant: 'destructive' });
      }
      setPendingVendorsState([]);
    }
  }, [user?.societyId, isAdmin, isSocietyAdmin, toast]);

  const fetchAllParkingSpots = useCallback(async () => {
    if (!user?.societyId || (!isAdmin() && !isSocietyAdmin())) {
        setAllParkingSpotsState([]);
        return;
    }
    try {
      const response = await fetch(`/api/parking/spots?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch parking spots.' }));
        throw new Error(errorData.message || 'Server error fetching parking spots.');
      }
      const spots: ParkingSpot[] = await response.json();
      setAllParkingSpotsState(spots);
    } catch (error: any) {
      console.error("Failed to fetch all parking spots:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Parking Spots', description: error.message, variant: 'destructive' });
      }
      setAllParkingSpotsState([]);
    }
  }, [user?.societyId, isAdmin, isSocietyAdmin, toast]);

  const fetchMyParkingSpots = useCallback(async () => {
    if (!user || !isOwnerOrRenter() || !user.societyId) {
      setMyParkingSpotsState([]);
      return;
    }
    try {
      const response = await fetch(`/api/parking/my-spots?userId=${user.id}&societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your parking spots.' }));
        throw new Error(errorData.message || 'Server error fetching your parking spots.');
      }
      const spots: ParkingSpot[] = await response.json();
      setMyParkingSpotsState(spots);
    } catch (error: any) {
      console.error("Failed to fetch my parking spots:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Your Parking Spots', description: error.message, variant: 'destructive' });
      }
      setMyParkingSpotsState([]);
    }
  }, [user, isOwnerOrRenter, toast]);

  const fetchFacilities = useCallback(async () => {
    if (!user?.societyId) {
        setFacilitiesState([]);
        return;
    }
    try {
      const response = await fetch(`/api/facilities?societyId=${user.societyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch facilities.' }));
        throw new Error(errorData.message || 'Server error while fetching facilities.');
      }
      const facilitiesData: Facility[] = await response.json();
      setFacilitiesState(facilitiesData);
    } catch (error: any) {
      console.error("Failed to fetch facilities:", error.message);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Loading Facilities', description: error.message, variant: 'destructive' });
      }
      setFacilitiesState([]);
    }
  }, [user?.societyId, toast]);

  const initialDataFetch = useCallback(async (currentUser: UserProfile | null) => {
    if (!currentUser) {
      setIsFetchingInitialData(false);
      return;
    }
    setIsFetchingInitialData(true);
    const commonFetches = [
      fetchSocietyInfo(),
      fetchActiveNotices(),
      fetchUpcomingMeetings(),
      fetchApprovedVendors(),
      fetchCommitteeMembers(),
      fetchSocietyPaymentDetails(),
      fetchApprovedResidents(),
      fetchVisitorEntries(),
      fetchFacilities(),
      fetchActiveSocietiesList(), // For registration page, useful if user logs out and goes to register
    ];

    const roleSpecificFetches = [];
    if (currentUser.role === USER_ROLES.SUPERADMIN || currentUser.role === USER_ROLES.SOCIETY_ADMIN) {
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
    if (currentUser.role === USER_ROLES.OWNER || currentUser.role === USER_ROLES.RENTER || currentUser.role === USER_ROLES.SUPERADMIN || currentUser.role === USER_ROLES.SOCIETY_ADMIN) {
         roleSpecificFetches.push(fetchGatePasses());
    }

    try {
        await Promise.all([...commonFetches, ...roleSpecificFetches]);
    } catch (error) {
        console.error("Error during initial data fetch batch:", error);
    } finally {
        setIsFetchingInitialData(false);
    }
  }, [
      fetchSocietyInfo, fetchActiveNotices, fetchUpcomingMeetings, fetchApprovedVendors, fetchCommitteeMembers,
      fetchSocietyPaymentDetails, fetchApprovedResidents, fetchVisitorEntries, fetchFacilities, fetchActiveSocietiesList,
      fetchAllUsers, fetchAllNoticesForAdmin, fetchAllMeetingsForAdmin, fetchPendingVendors, fetchAllParkingSpots,
      fetchMyComplaints, fetchMyParkingSpots, fetchGatePasses
  ]);

   useEffect(() => {
    setIsLoadingUser(true);
    if (user) {
        initialDataFetch(user).finally(() => setIsLoadingUser(false));
    } else {
        // If no user, still fetch active societies list for registration page
        fetchActiveSocietiesList().finally(() => setIsLoadingUser(false));
    }
  }, [user, initialDataFetch, fetchActiveSocietiesList]);


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
        if (typeof window !== 'undefined') {
          toast({ title: 'Login Failed', description: data.message || 'Invalid credentials.', variant: 'destructive' });
        }
        setUser(null);
        setIsLoadingUser(false);
        return false;
      }

      const loggedInUser = data as UserProfile;
       if (!loggedInUser.societyId && loggedInUser.role !== USER_ROLES.SUPERADMIN) { // Superadmin might not have a societyId initially
         if (typeof window !== 'undefined') {
          toast({ title: 'Login Failed', description: 'Society information missing for this user.', variant: 'destructive' });
        }
        setUser(null);
        setIsLoadingUser(false);
        return false;
      }
      // Approval check (Superadmin is always approved implicitly)
      if (loggedInUser.role !== USER_ROLES.SUPERADMIN && (loggedInUser.role === USER_ROLES.OWNER || loggedInUser.role === USER_ROLES.RENTER || loggedInUser.role === USER_ROLES.GUARD || loggedInUser.role === USER_ROLES.SOCIETY_ADMIN) && !loggedInUser.isApproved) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Login Failed', description: 'Your account is pending approval.', variant: 'destructive' });
        }
        setUser(null);
        setIsLoadingUser(false);
        return false;
      }

      setUser(loggedInUser);
      if (typeof window !== 'undefined') {
        toast({ title: 'Login Successful', description: `Welcome back, ${loggedInUser.name}!` });
      }
      router.push('/dashboard');
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Login Error', description: error.message || 'An unexpected error occurred during login.', variant: 'destructive' });
      }
      setUser(null);
      setIsLoadingUser(false);
      return false;
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
    setSocietyInfoState(null);
    setApprovedResidentsState([]);
    setAllParkingSpotsState([]);
    setMyParkingSpotsState([]);
    setFacilitiesState([]);
    // activeSocietiesList is kept for registration page

    router.push('/');
    if (typeof window !== 'undefined') {
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'registrationDate' | 'password' | 'tenantId'> & {password: string, role: Exclude<UserRole, "superadmin" | "societyAdmin">, societyId: string}): Promise<boolean> => {
    setIsLoadingUser(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData), // societyId is now part of userData
      });
      const data = await response.json();

      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Registration Failed', description: data.message || 'Could not create account.', variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Registration Successful', description: 'Your account has been created and is pending approval by an admin.' });
      }
      router.push('/');
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Registration Error', description: error.message || 'An unexpected error occurred during registration.', variant: 'destructive' });
      }
      return false;
    } finally {
      setIsLoadingUser(false);
    }
  };

  const approveResident = async (userId: string): Promise<boolean> => {
     if (!user?.societyId && !isAdmin()) { // Superadmin might operate without societyId context for cross-society actions
       if (typeof window !== 'undefined') {
         toast({ title: 'Error', description: 'Society context missing for approval.', variant: 'destructive' });
       }
       return false;
     }
    try {
      // If superadmin, they might need to specify which society's user they are approving,
      // For now, assume societyAdmin approves within their own society.
      const societyIdForApproval = user?.societyId || allUsers.find(u => u.id === userId)?.societyId;
      if (!societyIdForApproval) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Error', description: 'Target user society not found for approval.', variant: 'destructive' });
        }
        return false;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': societyIdForApproval },
        body: JSON.stringify({ isApproved: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Approval Failed', description: data.message || 'Could not approve user.', variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'User Approved', description: `${data.name} (${data.role}) has been approved.` });
      }
      await fetchAllUsers();
      await fetchApprovedResidents();
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Approval Error', description: error.message || 'An unexpected error occurred during approval.', variant: 'destructive' });
      }
      return false;
    }
  };

  const rejectUser = async (userId: string): Promise<boolean> => {
    const userToReject = allUsers.find(u => u.id === userId);
    const societyIdForRejection = userToReject?.societyId;

    if (!societyIdForRejection) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error', description: 'Target user society not found for rejection.', variant: 'destructive' });
      }
      return false;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
         headers: { 'X-Society-ID': societyIdForRejection },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to reject user.' }));
        if (typeof window !== 'undefined') {
          toast({ title: 'Rejection Failed', description: data.message || 'Could not reject user.', variant: 'destructive' });
        }
        return false;
      }
      const data = await response.json();
      if (typeof window !== 'undefined') {
        toast({ title: 'User Rejected', description: `Registration for ${data.name} has been rejected and removed.` });
      }
      await fetchAllUsers();
      await fetchApprovedResidents();
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Rejection Error', description: error.message || 'An unexpected error occurred during rejection.', variant: 'destructive' });
      }
      return false;
    }
  };

  const updateUserProfile = async (userId: string, updates: { name?: string; secondaryPhoneNumber1?: string; secondaryPhoneNumber2?: string }): Promise<UserProfile | null> => {
    if (!user?.societyId && user?.id !== userId) { // User can update their own profile even if superadmin without societyId
        if (typeof window !== 'undefined') {
          toast({ title: 'Error', description: 'Society context missing for profile update.', variant: 'destructive' });
        }
        return null;
    }
    const societyIdForUpdate = user?.societyId || allUsers.find(u => u.id === userId)?.societyId;
    if (!societyIdForUpdate) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Error', description: 'User society context not found for profile update.', variant: 'destructive' });
        }
        return null;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': societyIdForUpdate },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Profile Update Failed', description: data.message || 'Could not update profile.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
      }

      if (user && user.id === userId) {
        setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
      }
      if (isAdmin() || isSocietyAdmin()) {
        await fetchAllUsers();
      }
      await fetchApprovedResidents();
      return data as UserProfile;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Profile Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    const userToUpdate = allUsers.find(u => u.id === userId) || (user?.id === userId ? user : null);
    const societyIdForUpdate = userToUpdate?.societyId;

    if (!societyIdForUpdate && user?.role !== USER_ROLES.SUPERADMIN) {
        // Allow superadmin to change password even if they don't have a societyId set,
        // assuming they are changing for a user within some society context or their own global account.
        // This part might need more specific logic if superadmin can change passwords for users across societies.
        if (typeof window !== 'undefined') {
          toast({ title: 'Error', description: 'Society context missing for password change.', variant: 'destructive' });
        }
        return false;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(societyIdForUpdate && {'X-Society-ID': societyIdForUpdate}) },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Password Change Failed', description: data.message || 'Could not change password.', variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Password Changed', description: 'Your password has been successfully changed.' });
      }
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Password Change Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return false;
    }
  };

  const createGatePass = async (passData: Omit<GatePass, 'id' | 'tokenCode' | 'status' | 'createdAt' | 'updatedAt' | 'residentUserId' | 'residentFlatNumber' | 'societyId'>): Promise<GatePass | null> => {
    if (!user || !user.flatNumber || !user.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error', description: 'User, flat number, or society ID missing.', variant: 'destructive' });
      }
      return null;
    }
    const submissionData = {
        ...passData,
        residentUserId: user.id,
        residentFlatNumber: user.flatNumber,
        societyId: user.societyId,
    };
    try {
        const response = await fetch('/api/gate-passes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
        });
        const data = await response.json();
        if (!response.ok) {
          if (typeof window !== 'undefined') {
            toast({ title: 'Gate Pass Creation Failed', description: data.message || 'Could not create pass.', variant: 'destructive' });
          }
            return null;
        }
        if (typeof window !== 'undefined') {
          toast({ title: 'Gate Pass Created', description: `Pass for ${data.visitorName} created. Token: ${data.tokenCode}` });
        }
        await fetchGatePasses();
        return data as GatePass;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Gate Pass Creation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
        return null;
    }
  };

  const cancelGatePass = async (passId: string): Promise<boolean> => {
    if (!user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error', description: 'Society context missing.', variant: 'destructive' });
      }
      return false;
    }
    try {
        const response = await fetch(`/api/gate-passes/${passId}`, {
            method: 'DELETE',
            headers: { 'X-Society-ID': user.societyId }
        });
        const data = await response.json();
        if (!response.ok) {
          if (typeof window !== 'undefined') {
            toast({ title: 'Gate Pass Cancellation Failed', description: data.message || 'Could not cancel pass.', variant: 'destructive' });
          }
            return false;
        }
        if (typeof window !== 'undefined') {
          toast({ title: 'Gate Pass Cancelled', description: `Pass ID ${passId} has been cancelled.` });
        }
        await fetchGatePasses();
        return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Gate Pass Cancellation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
        return false;
    }
  };

  const markGatePassUsed = async (passId: string, guardId: string): Promise<{visitorEntry: VisitorEntry, updatedPass: GatePass} | null> => {
    if (!user?.societyId) { // Guard's societyId from their user object
      if (typeof window !== 'undefined') {
         toast({ title: 'Error', description: 'Society ID missing for guard action.', variant: 'destructive' });
      }
         return null;
    }
    try {
      const response = await fetch(`/api/gate-passes/${passId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': user.societyId },
        body: JSON.stringify({ status: GATE_PASS_STATUSES.USED, markedUsedBy: guardId, societyId: user.societyId }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Gate Pass Update Failed', description: data.message || 'Could not mark pass as used.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({
          title: 'Gate Pass Processed',
          description: `Visitor ${data.visitorEntry.visitorName} entry created. Pass ${data.updatedPass.tokenCode} marked as used.`,
        });
      }
      if (user?.role !== USER_ROLES.GUARD) {
          await fetchGatePasses();
      }
      await fetchVisitorEntries();
      return data;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Gate Pass Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const fetchGatePassByToken = async (tokenCode: string): Promise<GatePass | null> => {
    if (!user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error', description: 'Society ID required to search token.', variant: 'destructive' });
      }
        return null;
    }
    try {
      const response = await fetch(`/api/gate-passes/by-token/${tokenCode}?societyId=${user.societyId}`);
      if (!response.ok) {
        if (response.status === 404) {
          if (typeof window !== 'undefined') {
            toast({ title: 'Not Found', description: 'No gate pass found with this token.', variant: 'destructive' });
          }
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch gate pass by token.' }));
            if (typeof window !== 'undefined') {
              toast({ title: 'Error Fetching Pass', description: errorData.message || 'Server error.', variant: 'destructive' });
            }
        }
        return null;
      }
      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch gate pass by token:", error);
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Fetching Pass', description: error.message, variant: 'destructive' });
      }
      return null;
    }
  };

  const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'status' | 'userId' | 'userName' | 'userFlatNumber' | 'societyId'>): Promise<Complaint | null> => {
    if (!user || !user.flatNumber || !user.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error', description: 'User context (flat, society) missing.', variant: 'destructive' });
      }
      return null;
    }
    const submissionData = {
      ...complaintData,
      userId: user.id,
      userName: user.name,
      userFlatNumber: user.flatNumber,
      societyId: user.societyId,
    };
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Complaint Submission Failed', description: data.message || 'Could not submit complaint.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Complaint Submitted', description: 'Your complaint has been successfully submitted.' });
      }
      await fetchMyComplaints();
      return data as Complaint;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Complaint Submission Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const createNotice = async (noticeData: { title: string; content: string; }): Promise<Notice | null> => {
    if (!user || (!isAdmin() && !isSocietyAdmin()) || !user.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
        return null;
    }
    const submissionData = {
        ...noticeData,
        postedByUserId: user.id,
        postedByName: user.name,
        societyId: user.societyId,
    };
    try {
        const response = await fetch('/api/notices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
        });
        const data = await response.json();
        if (!response.ok) {
          if (typeof window !== 'undefined') {
            toast({ title: 'Notice Creation Failed', description: data.message || 'Could not create notice.', variant: 'destructive' });
          }
            return null;
        }
        if (typeof window !== 'undefined') {
          toast({ title: 'Notice Created', description: `Notice "${data.title}" has been posted.` });
        }
        await fetchActiveNotices();
        if (isAdmin() || isSocietyAdmin()) await fetchAllNoticesForAdmin();
        return data as Notice;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Notice Creation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
        return null;
    }
  };

  const updateNotice = async (noticeId: string, currentMonthYear: string, updates: Partial<Omit<Notice, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt' | 'societyId'>>): Promise<Notice | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': user.societyId },
        body: JSON.stringify({ ...updates, monthYear: currentMonthYear, societyId: user.societyId }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Notice Update Failed', description: data.message || 'Could not update notice.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Notice Updated', description: `Notice "${data.title}" has been updated.` });
      }
      await fetchActiveNotices();
      await fetchAllNoticesForAdmin();
      return data as Notice;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Notice Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteNotice = async (noticeId: string, currentMonthYear: string): Promise<boolean> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return false;
    }
    try {
      const response = await fetch(`/api/notices/${noticeId}?monthYear=${encodeURIComponent(currentMonthYear)}&societyId=${user.societyId}`, {
        method: 'DELETE',
        headers: { 'X-Society-ID': user.societyId }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete notice.' }));
        if (typeof window !== 'undefined') {
          toast({ title: 'Notice Deletion Failed', description: data.message || 'Could not delete notice.', variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Notice Deleted', description: 'The notice has been successfully deleted.' });
      }
      await fetchActiveNotices();
      await fetchAllNoticesForAdmin();
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Notice Deletion Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return false;
    }
  };

  const createMeeting = async (meetingData: Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'isActive' | 'monthYear' | 'updatedAt' | 'societyId'>): Promise<Meeting | null> => {
    if (!user || (!isAdmin() && !isSocietyAdmin()) || !user.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
        return null;
    }
    const submissionData = {
        ...meetingData,
        postedByUserId: user.id,
        postedByName: user.name,
        societyId: user.societyId,
    };
    try {
        const response = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
        });
        const data = await response.json();
        if (!response.ok) {
          if (typeof window !== 'undefined') {
            toast({ title: 'Meeting Creation Failed', description: data.message || 'Could not create meeting.', variant: 'destructive' });
          }
            return null;
        }
        if (typeof window !== 'undefined') {
          toast({ title: 'Meeting Created', description: `Meeting "${data.title}" has been scheduled.` });
        }
        await fetchUpcomingMeetings();
        if (isAdmin() || isSocietyAdmin()) await fetchAllMeetingsForAdmin();
        return data as Meeting;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Meeting Creation Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
        return null;
    }
  };

  const updateMeeting = async (meetingId: string, currentMonthYear: string, updates: Partial<Omit<Meeting, 'id' | 'postedByUserId' | 'postedByName' | 'createdAt' | 'monthYear' | 'updatedAt' | 'societyId'>>): Promise<Meeting | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    const body = { ...updates, monthYear: currentMonthYear, societyId: user.societyId };
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' , 'X-Society-ID': user.societyId},
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Meeting Update Failed', description: data.message || 'Could not update meeting.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Meeting Updated', description: `Meeting "${data.title}" has been updated.` });
      }
      await fetchUpcomingMeetings();
      await fetchAllMeetingsForAdmin();
      return data as Meeting;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Meeting Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteMeeting = async (meetingId: string, currentMonthYear: string): Promise<boolean> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return false;
    }
    try {
      const response = await fetch(`/api/meetings/${meetingId}?monthYear=${encodeURIComponent(currentMonthYear)}&societyId=${user.societyId}`, {
        method: 'DELETE',
        headers: { 'X-Society-ID': user.societyId }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete meeting.' }));
        if (typeof window !== 'undefined') {
          toast({ title: 'Meeting Deletion Failed', description: data.message || 'Could not delete meeting.', variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Meeting Deleted', description: 'The meeting has been successfully deleted.' });
      }
      await fetchUpcomingMeetings();
      await fetchAllMeetingsForAdmin();
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Meeting Deletion Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return false;
    }
  };

  const submitNewVendor = async (vendorData: Omit<Vendor, 'id' | 'submittedAt' | 'isApproved' | 'submittedByUserId' | 'submittedByName' | 'approvedByUserId' | 'approvedAt' | 'societyId'>): Promise<Vendor | null> => {
    if (!user || !user.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error', description: 'User context or society missing.', variant: 'destructive' });
      }
      return null;
    }
    const submissionData = {
      ...vendorData,
      submittedByUserId: user.id,
      submittedByName: user.name,
      societyId: user.societyId,
    };
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Vendor Submission Failed', description: data.message || 'Could not submit vendor for review.', variant: 'destructive' });
        }
        return null;
      }
      return data as Vendor;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Vendor Submission Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const approveVendor = async (vendorId: string): Promise<Vendor | null> => {
    if (!user || (!isAdmin() && !isSocietyAdmin()) || !user.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    try {
      const response = await fetch(`/api/vendors/admin/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': user.societyId },
        body: JSON.stringify({
          isApproved: true,
          approvedByUserId: user.id,
          societyId: user.societyId,
         }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Vendor Approval Failed', description: data.message || 'Could not approve vendor.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Vendor Approved', description: `Vendor "${data.name}" has been approved and added to the directory.` });
      }
      await fetchPendingVendors();
      await fetchApprovedVendors();
      return data as Vendor;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Vendor Approval Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const rejectVendor = async (vendorId: string): Promise<boolean> => {
     if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return false;
    }
    try {
      const response = await fetch(`/api/vendors/admin/${vendorId}?societyId=${user.societyId}`, {
        method: 'DELETE',
        headers: { 'X-Society-ID': user.societyId }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to reject vendor.' }));
        if (typeof window !== 'undefined') {
          toast({ title: 'Vendor Rejection Failed', description: data.message || 'Could not reject vendor submission.', variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Vendor Rejected', description: 'The vendor submission has been successfully rejected and removed.' });
      }
      await fetchPendingVendors();
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Vendor Rejection Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return false;
    }
  };

  const addCommitteeMember = async (memberData: Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt' | 'societyId'>): Promise<CommitteeMember | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    const submissionData = { ...memberData, societyId: user.societyId };
    try {
      const response = await fetch('/api/committee-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Failed to Add Member', description: data.message || 'Could not add committee member.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Member Added', description: `${data.name} has been added to the committee.` });
      }
      await fetchCommitteeMembers();
      return data as CommitteeMember;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Adding Member', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const updateCommitteeMember = async (memberId: string, memberData: Partial<Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt' | 'societyId'>>): Promise<CommitteeMember | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    try {
      const response = await fetch(`/api/committee-members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': user.societyId },
        body: JSON.stringify({...memberData, societyId: user.societyId}),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Failed to Update Member', description: data.message || 'Could not update committee member.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Member Updated', description: `${data.name}'s details have been updated.` });
      }
      await fetchCommitteeMembers();
      return data as CommitteeMember;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Updating Member', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteCommitteeMember = async (memberId: string): Promise<boolean> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return false;
    }
    try {
      const response = await fetch(`/api/committee-members/${memberId}?societyId=${user.societyId}`, {
        method: 'DELETE',
        headers: { 'X-Society-ID': user.societyId }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete member.'}));
        if (typeof window !== 'undefined') {
          toast({ title: 'Failed to Delete Member', description: data.message || 'Could not delete committee member.', variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Member Deleted', description: 'The committee member has been removed.' });
      }
      await fetchCommitteeMembers();
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Error Deleting Member', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return false;
    }
  };

  const updateSocietyPaymentDetails = async (details: Omit<SocietyPaymentDetails, 'id' | 'updatedAt' | 'societyId'>): Promise<SocietyPaymentDetails | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) { // Society Admins can also edit their own society's payment details
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    const submissionData = { ...details, societyId: user.societyId };
    try {
      const response = await fetch('/api/settings/payment-details', { // API will use societyId from user or body
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': user.societyId },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Update Failed', description: data.message || 'Could not update payment details.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Payment Details Updated', description: 'Society payment details have been updated.' });
      }
      setSocietyPaymentDetailsState(data as SocietyPaymentDetails);
      return data as SocietyPaymentDetails;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const updateSocietyInfo = async (settings: Omit<SocietyInfoSettings, 'id' | 'updatedAt' | 'societyId'>): Promise<SocietyInfoSettings | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) { // Society Admins can also edit their own society's info
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    const submissionData = { ...settings, societyId: user.societyId };
    try {
      const response = await fetch('/api/settings/society-info', { // API will use societyId from user or body
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': user.societyId },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Update Failed', description: data.message || 'Could not update society information.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Society Info Updated', description: 'Society information has been successfully updated.' });
      }
      setSocietyInfoState(data as SocietyInfoSettings);
      return data as SocietyInfoSettings;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Update Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      }
      return null;
    }
  };

  const createParkingSpot = async (spotData: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'societyId'>): Promise<ParkingSpot | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    const submissionData = { ...spotData, societyId: user.societyId };
    try {
      const response = await fetch('/api/parking/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Parking Spot Creation Failed', description: data.message || 'Could not create spot.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Parking Spot Created', description: `Spot ${data.spotNumber} created.` });
      }
      await fetchAllParkingSpots();
      return data as ParkingSpot;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Parking Spot Creation Error', description: error.message || 'An error occurred', variant: 'destructive' });
      }
      return null;
    }
  };

  const updateParkingSpot = async (spotId: string, updates: Partial<Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'societyId'>>): Promise<ParkingSpot | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    try {
      const response = await fetch(`/api/parking/spots/${spotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': user.societyId },
        body: JSON.stringify({...updates, societyId: user.societyId}),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Parking Spot Update Failed', description: data.message || 'Could not update spot.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Parking Spot Updated', description: `Spot ${data.spotNumber} updated.` });
      }
      await fetchAllParkingSpots();
      await fetchMyParkingSpots();
      return data as ParkingSpot;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Parking Spot Update Error', description: error.message || 'An error occurred', variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteParkingSpot = async (spotId: string): Promise<boolean> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return false;
    }
    try {
      const response = await fetch(`/api/parking/spots/${spotId}?societyId=${user.societyId}`, {
        method: 'DELETE',
        headers: { 'X-Society-ID': user.societyId }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete spot.' }));
        if (typeof window !== 'undefined') {
          toast({ title: 'Parking Spot Deletion Failed', description: data.message, variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Parking Spot Deleted', description: `Spot ${spotId} deleted.` });
      }
      await fetchAllParkingSpots();
      await fetchMyParkingSpots();
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Parking Spot Deletion Error', description: error.message || 'An error occurred', variant: 'destructive' });
      }
      return false;
    }
  };

  const createFacility = async (facilityData: Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'societyId'>): Promise<Facility | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    const submissionData = { ...facilityData, societyId: user.societyId };
    try {
      const response = await fetch('/api/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Facility Creation Failed', description: data.message || 'Could not create facility.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Facility Created', description: `Facility "${data.name}" has been added.` });
      }
      await fetchFacilities();
      return data as Facility;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Facility Creation Error', description: error.message || 'An error occurred', variant: 'destructive' });
      }
      return null;
    }
  };

  const updateFacility = async (facilityId: string, updates: Partial<Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'societyId'>>): Promise<Facility | null> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return null;
    }
    try {
      const response = await fetch(`/api/facilities/${facilityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Society-ID': user.societyId },
        body: JSON.stringify({...updates, societyId: user.societyId}),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          toast({ title: 'Facility Update Failed', description: data.message || 'Could not update facility.', variant: 'destructive' });
        }
        return null;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Facility Updated', description: `Facility "${data.name}" has been updated.` });
      }
      await fetchFacilities();
      return data as Facility;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Facility Update Error', description: error.message || 'An error occurred', variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteFacility = async (facilityId: string): Promise<boolean> => {
    if ((!isAdmin() && !isSocietyAdmin()) || !user?.societyId) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      }
      return false;
    }
    try {
      const response = await fetch(`/api/facilities/${facilityId}?societyId=${user.societyId}`, {
        method: 'DELETE',
        headers: { 'X-Society-ID': user.societyId }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete facility.' }));
        if (typeof window !== 'undefined') {
          toast({ title: 'Facility Deletion Failed', description: data.message, variant: 'destructive' });
        }
        return false;
      }
      if (typeof window !== 'undefined') {
        toast({ title: 'Facility Deleted', description: 'The facility has been successfully deleted.' });
      }
      await fetchFacilities();
      return true;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        toast({ title: 'Facility Deletion Error', description: error.message || 'An error occurred', variant: 'destructive' });
      }
      return false;
    }
  };


  const contextValue = {
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
      isSocietyAdmin,
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
      initialDataFetch,
      activeSocietiesList,
      fetchActiveSocietiesList,
      createSociety,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

    
