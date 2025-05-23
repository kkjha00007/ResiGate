
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Home, Car, Send, ListChecks, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { addVisitorEntry } from '@/lib/store';
import type { VisitorEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { VISIT_PURPOSES, PUBLIC_ENTRY_SOURCE, APP_NAME } from '@/lib/constants';
import { format } from 'date-fns';

const publicVisitorEntrySchema = z.object({
  visitorName: z.string().min(2, { message: 'Visitor name must be at least 2 characters.' }),
  mobileNumber: z.string().regex(/^\d{10}$/, { message: 'Mobile number must be 10 digits.' }),
  flatNumber: z.string().min(1, { message: 'Flat number is required.' }),
  purposeOfVisit: z.enum(VISIT_PURPOSES, { required_error: 'Purpose of visit is required.' }),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PublicVisitorEntryFormValues = z.infer<typeof publicVisitorEntrySchema>;

interface SubmissionDetails {
  visitorName: string;
  tokenCode: string;
  entryTime: string;
}

export function PublicVisitorEntryForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails | null>(null);

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

  const generateTokenCode = () => {
    const timestampSuffix = Date.now().toString().slice(-6);
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RG-${timestampSuffix}-${randomChars}`;
  };

  const onSubmit = async (data: PublicVisitorEntryFormValues) => {
    setIsSubmitting(true);
    const tokenCode = generateTokenCode();
    const entryTimestamp = new Date();

    const newEntry: VisitorEntry = {
      id: `pub-visitor-${Date.now()}`,
      ...data,
      entryTimestamp,
      enteredBy: PUBLIC_ENTRY_SOURCE,
      tokenCode,
    };

    addVisitorEntry(newEntry);
    
    setSubmissionDetails({
      visitorName: data.visitorName,
      tokenCode,
      entryTime: format(entryTimestamp, "PPpp"),
    });

    toast({ title: 'Entry Submitted', description: 'Your details have been recorded.' });
    setIsSubmitting(false);
    form.reset(); 
  };

  const handleMakeAnotherEntry = () => {
    setSubmissionDetails(null);
    form.reset({ 
        visitorName: '',
        mobileNumber: '',
        flatNumber: '',
        purposeOfVisit: undefined,
        vehicleNumber: '',
        notes: '',
     });
  };

  if (submissionDetails) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-semibold text-primary">Entry Submitted Successfully!</h2>
            <p className="text-lg">
              Thank you, <span className="font-semibold">{submissionDetails.visitorName}</span>.
            </p>
            <div className="p-4 bg-secondary/50 rounded-md border border-secondary">
              <p className="text-base">
                Your Token Code: <strong className="text-2xl tracking-wider text-accent-foreground bg-accent px-2 py-1 rounded">{submissionDetails.tokenCode}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Entry Time: {submissionDetails.entryTime}
              </p>
            </div>
            <div className="mt-6 bg-primary text-primary-foreground p-4 rounded-lg shadow-md flex items-center gap-3 text-left">
              <Info className="h-8 w-8 flex-shrink-0" />
              <p className="text-base font-semibold">
                IMPORTANT: Please show this token code to the security guard for verification.
              </p>
            </div>
            <Button onClick={handleMakeAnotherEntry} className="mt-8 w-full" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" /> Make Another Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Visitor Self Entry</CardTitle>
        <CardDescription>Please fill in your details to register your visit. This will generate a token for security.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="visitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name *</FormLabel>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <div className="relative">
                          <ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select purpose of visit" />
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
                      <Textarea placeholder="Any other relevant information..." {...field} />
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
                 <Send className="mr-2 h-5 w-5" /> Submit & Get Token
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
