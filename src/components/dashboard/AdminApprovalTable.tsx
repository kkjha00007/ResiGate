'use client';

import React, { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Users, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminApprovalTable() {
  const { allUsers, fetchAllUsers, approveResident, rejectUser, isAdmin, isLoading } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (isAdmin()) {
      fetchAllUsers(false); // Only fetch unapproved users from backend
    }
  }, [isAdmin, fetchAllUsers]);

  useEffect(() => {
    setPendingUsers(
      allUsers
        .filter(u => u.role !== USER_ROLES.SUPERADMIN) // Still filter out superadmins
        .sort((a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime())
    );
  }, [allUsers]);


  const handleApprove = async (userId: string) => {
    await approveResident(userId);
    await fetchAllUsers(false); // Refetch only pending users
  };

  const handleReject = async (userId: string) => {
    await rejectUser(userId);
    await fetchAllUsers(false); // Refetch only pending users
  };

  if (isLoading && !allUsers.length) {
     return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin()) {
     return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to view this page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">User Account Approvals</CardTitle>
        </div>
        <CardDescription>Review and approve or reject pending user registrations (Owners, Renters, Guards).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Flat No.</TableHead>
                <TableHead>Registered On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.length > 0 ? (
                pendingUsers.map((userToProcess) => (
                  <TableRow key={userToProcess.id}>
                    <TableCell className="font-medium">{userToProcess.name}</TableCell>
                    <TableCell>{userToProcess.email}</TableCell>
                    <TableCell className="capitalize">{userToProcess.role}</TableCell>
                    <TableCell>{userToProcess.flatNumber}</TableCell>
                    <TableCell>{format(new Date(userToProcess.registrationDate), 'PPpp')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending Approval</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to approve {userToProcess.name} ({userToProcess.role})
                              {userToProcess.flatNumber !== 'NA' ? ` for flat ${userToProcess.flatNumber}` : ''}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleApprove(userToProcess.id)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              Approve User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button size="sm" variant="destructive">
                            <XCircle className="mr-2 h-4 w-4" /> Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to reject the registration for {userToProcess.name} ({userToProcess.role})
                              {userToProcess.flatNumber !== 'NA' ? ` for flat ${userToProcess.flatNumber}` : ''}? This action will permanently delete their registration.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleReject(userToProcess.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Reject User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {isLoading ? 'Loading pending approvals...' : 'No pending user approvals.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
