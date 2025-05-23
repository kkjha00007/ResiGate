'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole } from './types';
import { getUsers, setUsers, addUser, updateUser, getLoggedInUser, setLoggedInUser, initializeStores } from './store';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { USER_ROLES } from './constants';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'isApproved' | 'role' | 'registrationDate'>) => Promise<boolean>;
  approveResident: (userId: string) => Promise<boolean>;
  isAdmin: () => boolean;
  isResident: () => boolean;
  allUsers: User[]; // For admin approvals
  fetchUsers: () => void; // To refresh users list
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsersState] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    initializeStores(); // Initialize localStorage with mock data if needed
    const storedUser = getLoggedInUser();
    if (storedUser) {
      setUser(storedUser);
    }
    fetchUsers();
    setIsLoading(false);
  }, []);

  const fetchUsers = () => {
    setAllUsersState(getUsers());
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password); // Plain text compare for mock

    if (foundUser) {
      if (foundUser.role === USER_ROLES.RESIDENT && !foundUser.isApproved) {
        toast({ title: 'Login Failed', description: 'Your account is pending approval.', variant: 'destructive' });
        setIsLoading(false);
        return false;
      }
      setUser(foundUser);
      setLoggedInUser(foundUser);
      toast({ title: 'Login Successful', description: `Welcome back, ${foundUser.name}!` });
      router.push('/dashboard');
      setIsLoading(false);
      return true;
    } else {
      toast({ title: 'Login Failed', description: 'Invalid email or password.', variant: 'destructive' });
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setLoggedInUser(null);
    router.push('/login');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'role' | 'registrationDate' | 'password'> & {password: string, flatNumber: string}): Promise<boolean> => {
    const users = getUsers();
    if (users.some(u => u.email === userData.email)) {
      toast({ title: 'Registration Failed', description: 'Email already exists.', variant: 'destructive' });
      return false;
    }
    const newUser: User = {
      ...userData,
      id: `user-resident-${Date.now()}`,
      role: USER_ROLES.RESIDENT,
      isApproved: false, // Residents need approval
      registrationDate: new Date(),
    };
    addUser(newUser);
    fetchUsers(); // refresh user list
    toast({ title: 'Registration Successful', description: 'Your account has been created and is pending approval.' });
    router.push('/login');
    return true;
  };

  const approveResident = async (userId: string): Promise<boolean> => {
    const userToApprove = allUsers.find(u => u.id === userId);
    if (userToApprove && userToApprove.role === USER_ROLES.RESIDENT) {
      const updatedRes = { ...userToApprove, isApproved: true };
      updateUser(updatedRes);
      fetchUsers(); // refresh user list
      toast({ title: 'Resident Approved', description: `${userToApprove.name} has been approved.` });
      return true;
    }
    toast({ title: 'Approval Failed', description: 'User not found or cannot be approved.', variant: 'destructive' });
    return false;
  };
  
  const isAdmin = () => user?.role === USER_ROLES.SUPERADMIN;
  const isResident = () => user?.role === USER_ROLES.RESIDENT;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, approveResident, isAdmin, isResident, allUsers, fetchUsers }}>
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
