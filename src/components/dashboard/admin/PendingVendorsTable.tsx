
// src/components/dashboard/admin/PendingVendorsTable.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { Vendor } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, UsersCog, Info, Store, User, Phone, MapPin, ListChecks, Briefcase } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

export function PendingVendorsTable() {
  const { user, pendingVendors, fetchPendingVendors, approveVendor, rejectVendor, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // vendorId being processed
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);


  useEffect(() => {
    if (user && user.role === 'superadmin') {
      fetchPendingVendors();
    }
  }, [user, fetchPendingVendors]);

  const handleApprove = async (vendorId: string) => {
    if (!user) return;
    setIsProcessing(vendorId);
    await approveVendor(vendorId);
    setIsProcessing(null);
  };

  const handleReject = async (vendorId: string) => {
    setIsProcessing(vendorId);
    await rejectVendor(vendorId);
    setIsProcessing(null);
  };

  if (authLoading && pendingVendors.length === 0) {
    return (
      <div className="flex h-[calc(50vh)] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading pending vendor submissions...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <UsersCog className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Pending Vendor Approvals</CardTitle>
            <CardDescription>Review and approve or reject new vendor submissions.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pendingVendors.length === 0 ? (
          <div className="text-center py-10">
            <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending vendor submissions at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell><Badge variant="outline">{vendor.category}</Badge></TableCell>
                    <TableCell>{vendor.submittedByName}</TableCell>
                    <TableCell>{format(parseISO(vendor.submittedAt), 'PPpp')}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Dialog onOpenChange={(open) => { if (open) setViewingVendor(vendor); else setViewingVendor(null);}}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                    <Info className="mr-1 h-4 w-4" /> View
                                </Button>
                            </DialogTrigger>
                             {viewingVendor && viewingVendor.id === vendor.id && (
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl text-primary">{viewingVendor.name}</DialogTitle>
                                        <CardDescription><Badge variant="secondary">{viewingVendor.category}</Badge></CardDescription>
                                    </DialogHeader>
                                    <div className="grid gap-3 py-4 text-sm">
                                        {viewingVendor.contactPerson && <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/><strong>Contact:</strong> {viewingVendor.contactPerson}</div>}
                                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><strong>Phone:</strong> {viewingVendor.phoneNumber}</div>
                                        {viewingVendor.alternatePhoneNumber && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><strong>Alt. Phone:</strong> {viewingVendor.alternatePhoneNumber}</div>}
                                        {viewingVendor.address && <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5"/><strong>Address:</strong> <span className="whitespace-pre-wrap">{viewingVendor.address}</span></div>}
                                        <div className="flex items-start gap-2"><Briefcase className="h-4 w-4 text-muted-foreground mt-0.5"/><strong>Services:</strong> <span className="whitespace-pre-wrap">{viewingVendor.servicesOffered}</span></div>
                                        {viewingVendor.notes && <div className="flex items-start gap-2"><ListChecks className="h-4 w-4 text-muted-foreground mt-0.5"/><strong>Notes:</strong> <span className="whitespace-pre-wrap">{viewingVendor.notes}</span></div>}
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Submitted by {viewingVendor.submittedByName} on {format(parseISO(viewingVendor.submittedAt), 'PPpp')}
                                        </div>
                                    </div>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Close</Button>
                                    </DialogClose>
                                </DialogContent>
                             )}
                        </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" disabled={isProcessing === vendor.id}>
                            {isProcessing === vendor.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-1 border-current"></div> : <CheckCircle className="mr-1 h-4 w-4" />}
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to approve the vendor "<strong>{vendor.name}</strong>"? This will make it visible in the public directory.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleApprove(vendor.id)} className="bg-primary hover:bg-primary/90" disabled={isProcessing === vendor.id}>
                              {isProcessing === vendor.id ? 'Approving...' : 'Confirm Approve'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isProcessing === vendor.id}>
                            {isProcessing === vendor.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-1 border-current"></div> : <XCircle className="mr-1 h-4 w-4" />}
                             Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to reject and delete the vendor submission "<strong>{vendor.name}</strong>"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleReject(vendor.id)} className="bg-destructive hover:bg-destructive/90" disabled={isProcessing === vendor.id}>
                             {isProcessing === vendor.id ? 'Rejecting...' : 'Confirm Reject'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
