
// src/app/dashboard/payment-details/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, QrCode, Edit3, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { SocietyPaymentDetails } from '@/lib/types';
import { EditPaymentDetailsDialog } from '@/components/dashboard/admin/EditPaymentDetailsDialog'; // To be created
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentDetailsPage() {
  const { user, isLoading: authLoading, isOwnerOrRenter, isAdmin, societyPaymentDetails, fetchSocietyPaymentDetails } = useAuth();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    setIsLoadingDetails(true);
    fetchSocietyPaymentDetails().finally(() => setIsLoadingDetails(false));
  }, [fetchSocietyPaymentDetails]);


  if (authLoading || isLoadingDetails) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Landmark className="h-8 w-8 text-primary" />
              <div>
                <Skeleton className="h-7 w-72 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 p-4 border rounded-lg bg-secondary/30">
              <Skeleton className="h-5 w-40 mb-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3 p-4 border rounded-lg bg-secondary/30">
              <Skeleton className="h-5 w-48 mb-2" />
              <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-md h-64 border-2 border-dashed border-border">
                <Skeleton className="h-20 w-20 rounded-md mb-4" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user || (!isOwnerOrRenter() && !isAdmin())) {
     router.replace('/dashboard'); // Should not happen if useEffect above works, but good failsafe
     return <div className="flex h-[calc(100vh-10rem)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>;
  }
  
  const details = societyPaymentDetails || { // Fallback to empty strings if details are null
    bankName: 'N/A',
    accountHolderName: 'N/A',
    accountNumber: 'N/A',
    ifscCode: 'N/A',
    branchName: 'N/A',
    accountType: 'N/A',
    upiId: '', // upiId is optional so empty string is fine
  };


  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Landmark className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-semibold text-primary">Society Maintenance Payment</CardTitle>
                <CardDescription>Details for paying your society maintenance fees.</CardDescription>
              </div>
            </div>
            {isAdmin() && (
              <Button onClick={() => setIsEditDialogOpen(true)} variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Details
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 p-4 border rounded-lg bg-secondary/30">
            <h3 className="text-lg font-medium text-foreground mb-2">Bank Account Details:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Bank Name:</p>
                <p className="font-medium text-foreground">{details.bankName || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Holder:</p>
                <p className="font-medium text-foreground">{details.accountHolderName || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Number:</p>
                <p className="font-medium text-foreground">{details.accountNumber || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">IFSC Code:</p>
                <p className="font-medium text-foreground">{details.ifscCode || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Branch Name:</p>
                <p className="font-medium text-foreground">{details.branchName || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Type:</p>
                <p className="font-medium text-foreground">{details.accountType || "Not set"}</p>
              </div>
              {details.upiId && (
                 <div>
                    <p className="text-muted-foreground">UPI ID:</p>
                    <p className="font-medium text-foreground">{details.upiId}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-secondary/30">
            <h3 className="text-lg font-medium text-foreground mb-2">Scan QR Code to Pay:</h3>
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-md h-64 border-2 border-dashed border-border">
              <QrCode className="h-20 w-20 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {details.upiId ? `Scan to pay using UPI ID: ${details.upiId}` : "QR Code for UPI payments will be added here soon."}
              </p>
              {!details.upiId && <p className="text-xs text-muted-foreground mt-1">Please use the bank details above for now.</p>}
            </div>
          </div>

           <div className="text-sm text-muted-foreground pt-4">
            <p><strong>Note:</strong> After making a payment, please inform the society office or upload your payment confirmation through the designated portal/email (if applicable) to ensure your account is updated.</p>
          </div>
        </CardContent>
      </Card>
      {isAdmin() && societyPaymentDetails && (
        <EditPaymentDetailsDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          currentDetails={societyPaymentDetails}
        />
      )}
    </div>
  );
}
