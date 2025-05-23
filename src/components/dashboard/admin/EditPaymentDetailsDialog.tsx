
// src/components/dashboard/admin/EditPaymentDetailsDialog.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import type { SocietyPaymentDetails } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Banknote, User, Hash, Landmark, Save, Building } from 'lucide-react'; // Added Building for Branch

const paymentDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank Name is required."),
  accountHolderName: z.string().min(1, "Account Holder Name is required."),
  accountNumber: z.string().min(1, "Account Number is required.").regex(/^\d+$/, "Account number must contain only digits."),
  ifscCode: z.string().min(1, "IFSC Code is required.").regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format."),
  branchName: z.string().min(1, "Branch Name is required."),
  accountType: z.string().min(1, "Account Type is required."),
  upiId: z.string().optional(),
});

type PaymentDetailsFormValues = z.infer<typeof paymentDetailsSchema>;

interface EditPaymentDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentDetails: SocietyPaymentDetails;
}

export function EditPaymentDetailsDialog({
  isOpen,
  onOpenChange,
  currentDetails,
}: EditPaymentDetailsDialogProps) {
  const { updateSocietyPaymentDetails } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentDetailsFormValues>({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: {
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      accountType: '',
      upiId: '',
    },
  });

  useEffect(() => {
    if (currentDetails) {
      form.reset({
        bankName: currentDetails.bankName || '',
        accountHolderName: currentDetails.accountHolderName || '',
        accountNumber: currentDetails.accountNumber || '',
        ifscCode: currentDetails.ifscCode || '',
        branchName: currentDetails.branchName || '',
        accountType: currentDetails.accountType || '',
        upiId: currentDetails.upiId || '',
      });
    }
  }, [currentDetails, form, isOpen]); // Re-populate form when dialog opens or currentDetails change

  const handleSubmit = async (data: PaymentDetailsFormValues) => {
    setIsSubmitting(true);
    const result = await updateSocietyPaymentDetails(data);
    if (result) {
      onOpenChange(false); // Close dialog on successful update
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-primary">Edit Payment Details</DialogTitle>
          <DialogDescription>Update the society's bank account information for maintenance payments.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., State Bank of India" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountHolderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., ResiGate Welfare Association" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter account number" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ifscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IFSC Code *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., SBIN0001234" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Main Branch, CityName" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type *</FormLabel>
                  <FormControl>
                     <Input placeholder="e.g., Savings, Current" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="upiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPI ID (Optional)</FormLabel>
                  <FormControl>
                     <Input placeholder="e.g., societyname@okbank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                ) : (
                   <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
