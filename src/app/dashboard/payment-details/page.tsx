
// src/app/dashboard/payment-details/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, QrCode } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PaymentDetailsPage() {
  const { user, isLoading, isOwnerOrRenter } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isOwnerOrRenter())) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, isOwnerOrRenter, router]);

  if (isLoading || !user || !isOwnerOrRenter()) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Placeholder data - replace with actual society bank details
  const bankDetails = {
    bankName: 'Example Bank of India',
    accountHolderName: 'ResiGate Society Welfare Association',
    accountNumber: '123456789012',
    ifscCode: 'EXAM0001234',
    branchName: 'Main Branch, Your City',
    accountType: 'Savings Account',
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">Society Maintenance Payment</CardTitle>
              <CardDescription>Details for paying your society maintenance fees.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 p-4 border rounded-lg bg-secondary/30">
            <h3 className="text-lg font-medium text-foreground mb-2">Bank Account Details:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Bank Name:</p>
                <p className="font-medium text-foreground">{bankDetails.bankName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Holder:</p>
                <p className="font-medium text-foreground">{bankDetails.accountHolderName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Number:</p>
                <p className="font-medium text-foreground">{bankDetails.accountNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">IFSC Code:</p>
                <p className="font-medium text-foreground">{bankDetails.ifscCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Branch Name:</p>
                <p className="font-medium text-foreground">{bankDetails.branchName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Type:</p>
                <p className="font-medium text-foreground">{bankDetails.accountType}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-secondary/30">
            <h3 className="text-lg font-medium text-foreground mb-2">Scan QR Code to Pay:</h3>
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-md h-64 border-2 border-dashed border-border">
              <QrCode className="h-20 w-20 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                QR Code for UPI payments will be added here soon.
              </p>
              <p className="text-xs text-muted-foreground mt-1">Please use the bank details above for now.</p>
            </div>
          </div>

           <div className="text-sm text-muted-foreground pt-4">
            <p><strong>Note:</strong> After making a payment, please inform the society office or upload your payment confirmation through the designated portal/email (if applicable) to ensure your account is updated.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
