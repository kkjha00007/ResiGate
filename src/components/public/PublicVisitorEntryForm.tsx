
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { VISIT_PURPOSES, PUBLIC_ENTRY_SOURCE, APP_NAME } from '@/lib/constants';
import type { VisitorEntry } from '@/lib/types';
import { User, Phone, Home, Car, Send, ListChecks, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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
      purposeOfVisit: undefined,
      vehicleNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: PublicVisitorEntryFormValues) => {
    setIsSubmitting(true);

    const submissionData: Omit<VisitorEntry, 'id' | 'entryTimestamp' | 'tokenCode' | 'enteredBy' | 'visitorPhotoUrl'> = {
      ...data,
      // Backend will set timestamp, tokenCode, and enteredBy
    };

    try {
      const response = await fetch('/api/public-visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
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
      toast({ title: 'Entry Submitted Successfully!', description: `Your token code is ${responseData.tokenCode}.`});

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
      <Card className="w-full max-w-lg shadow-xl bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <ShieldCheck className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Entry Submitted Successfully!</CardTitle>
          <CardDescription>Thank you, {successInfo.visitorName}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-accent/20 border border-accent/50 text-accent-foreground p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-5 w-5 text-accent" />
              <strong className="text-accent">IMPORTANT: Show to Security</strong>
            </div>
            <p className="text-sm">
              Please show this information to the security guard for verification.
            </p>
          </div>

          <div className="space-y-2 text-sm text-foreground">
            <p><strong>Token Code:</strong> <span className="text-lg font-semibold text-primary bg-primary/10 px-2 py-1 rounded">{successInfo.tokenCode}</span></p>
            <p><strong>Entry Time:</strong> {format(new Date(successInfo.entryTimestamp), "PPpp")}</p>
          </div>
          
          <Button onClick={() => setSuccessInfo(null)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <RefreshCw className="mr-2 h-4 w-4" /> Make Another Entry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Visitor Self Entry</CardTitle>
        <CardDescription>Please fill in your details to generate an entry token. Fields marked * are required.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="visitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Full Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., John Doe" {...field} className="pl-10" />
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
                        <Input placeholder="e.g., A-101 or B-203" {...field} className="pl-10" />
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
                  <FormLabel>Vehicle Number (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., DL1AB1234" {...field} className="pl-10" />
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
                      <Textarea placeholder="Any other relevant information..." {...field} rows={3} />
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
                 <Send className="mr-2 h-5 w-5" /> Get Entry Token
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
