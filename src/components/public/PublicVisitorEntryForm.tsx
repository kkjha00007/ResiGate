
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Keep for notes
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Home, Car, Send, ListChecks, InfoIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { VISIT_PURPOSES } from '@/lib/constants'; // Import shared purposes
import { format } from 'date-fns';
import type { VisitorEntry } from '@/lib/types';


const publicVisitorEntrySchema = z.object({
  visitorName: z.string().min(2, { message: 'Visitor name must be at least 2 characters.' }),
  mobileNumber: z.string().regex(/^\d{10}$/, { message: 'Mobile number must be 10 digits.' }),
  flatNumber: z.string().min(1, { message: 'Flat number is required.' }),
  purposeOfVisit: z.enum(VISIT_PURPOSES, { required_error: 'Purpose of visit is required.' }),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PublicVisitorEntryFormValues = z.infer<typeof publicVisitorEntrySchema>;

interface SuccessInfo {
  visitorName: string;
  tokenCode: string;
  entryTimestamp: string;
}

export function PublicVisitorEntryForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  const form = useForm<PublicVisitorEntryFormValues>({
    resolver: zodResolver(publicVisitorEntrySchema),
    defaultValues: {
      visitorName: '',
      mobileNumber: '',
      flatNumber: '',
      vehicleNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: PublicVisitorEntryFormValues) => {
    setIsSubmitting(true);
    setSuccessInfo(null);

    try {
      const response = await fetch('/api/public-visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit visitor entry');
      }
      
      setSuccessInfo({
        visitorName: responseData.visitorName,
        tokenCode: responseData.tokenCode,
        entryTimestamp: responseData.entryTimestamp,
      });
      form.reset();
      toast({ title: 'Entry Submitted Successfully!', description: 'Please show the token to the guard.' });

    } catch (error) {
      console.error("Failed to submit public visitor entry:", error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({ title: 'Submission Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Entry Submitted!</CardTitle>
          <CardDescription>Thank you, {successInfo.visitorName}. Your details have been recorded.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Your Token Code:</p>
            <p className="text-3xl font-bold text-center py-2 bg-accent/20 text-accent-foreground rounded-md">{successInfo.tokenCode}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entry Time:</p>
            <p className="font-medium">{format(new Date(successInfo.entryTimestamp), "PPpp")}</p>
          </div>
          <div className="mt-6 p-3 bg-primary/10 border border-primary/30 rounded-md flex items-start gap-3">
            <InfoIcon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
                <h3 className="font-semibold text-primary text-lg">IMPORTANT</h3>
                <p className="text-sm text-foreground font-medium">
                Please show this token code to the security guard for verification.
                </p>
            </div>
          </div>
          <Button onClick={() => setSuccessInfo(null)} className="w-full mt-6">
            Make Another Entry
          </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Visitor Self Entry</CardTitle>
        <CardDescription>Please fill in your details to request entry. Entry time is recorded automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="visitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Full Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Jane Smith" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Mobile Number *</FormLabel>
                  <FormControl>
                   <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="tel" placeholder="e.g., 9876543210" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat Number to Visit *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., A-101" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purposeOfVisit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Visit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <div className="relative">
                          <ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select your purpose" />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        {VISIT_PURPOSES.map((purpose) => (
                          <SelectItem key={purpose} value={purpose}>
                            {purpose}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Number (If applicable)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., KA01XY1234" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Meeting with Mr. Sharma, parcel for Priya" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                 <Send className="mr-2 h-5 w-5" /> Submit Request
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
