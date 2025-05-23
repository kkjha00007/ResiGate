
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
import { User, Phone, Home, Car, Send, FilePlus, ListChecks, BadgeCheck, RefreshCcw, Ticket } from 'lucide-react';
import { addVisitorEntry } from '@/lib/store';
import type { VisitorEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { VISIT_PURPOSES, PUBLIC_ENTRY_SOURCE, APP_NAME } from '@/lib/constants';
import { format } from 'date-fns';

const publicVisitorEntrySchema = z.object({
  visitorName: z.string().min(2, { message: 'Your name must be at least 2 characters.' }),
  mobileNumber: z.string().regex(/^\d{10}$/, { message: 'Mobile number must be 10 digits.' }),
  flatNumber: z.string().min(1, { message: 'Flat number you are visiting is required.' }),
  purposeOfVisit: z.enum(VISIT_PURPOSES, { required_error: 'Purpose of visit is required.' }),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PublicVisitorEntryFormValues = z.infer<typeof publicVisitorEntrySchema>;

interface SubmissionResult {
  tokenCode: string;
  entryTime: Date;
  visitorName: string;
  flatNumber: string;
}

export function PublicVisitorEntryForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

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

    const entryTimestamp = new Date();
    const tokenCode = `RG-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newEntry: VisitorEntry = {
      id: `pub-visitor-${Date.now()}`,
      ...data,
      entryTimestamp,
      tokenCode,
      enteredBy: PUBLIC_ENTRY_SOURCE,
      visitorPhotoUrl: undefined, // No photo for public entry
    };

    addVisitorEntry(newEntry);
    
    setSubmissionResult({
      tokenCode,
      entryTime: entryTimestamp,
      visitorName: data.visitorName,
      flatNumber: data.flatNumber,
    });

    toast({ 
      title: 'Entry Submitted Successfully!', 
      description: `Your token is ${tokenCode}. Please show this to the guard.`,
      duration: 10000 // Keep toast longer as primary confirmation
    });
    setIsSubmitting(false);
  };

  const handleMakeAnotherEntry = () => {
    setSubmissionResult(null);
    form.reset({
      visitorName: '',
      mobileNumber: '',
      flatNumber: '',
      purposeOfVisit: undefined,
      vehicleNumber: '',
      notes: '',
    });
  };

  if (submissionResult) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <BadgeCheck className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Entry Confirmed!</CardTitle>
          <CardDescription>Thank you, {submissionResult.visitorName}. Your entry has been logged.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-dashed border-primary rounded-lg bg-primary/10 text-center">
            <p className="text-sm text-muted-foreground mb-1">Your Entry Token:</p>
            <p className="text-3xl font-bold text-primary tracking-wider">{submissionResult.tokenCode}</p>
          </div>
          <div className="text-sm text-foreground space-y-1">
            <p><strong className="font-medium">Visiting Flat:</strong> {submissionResult.flatNumber}</p>
            <p><strong className="font-medium">Entry Time:</strong> {format(submissionResult.entryTime, "PPpp")}</p>
          </div>
          <div className="mt-6 p-3 bg-accent/20 rounded-md text-center">
            <p className="font-semibold text-accent-foreground">
              IMPORTANT: Please show this token code to the security guard for verification.
            </p>
          </div>
          <Button onClick={handleMakeAnotherEntry} className="w-full mt-6">
            <RefreshCcw className="mr-2 h-4 w-4" /> Make Another Entry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
         <div className="flex items-center justify-center gap-2 mb-2">
            <Ticket className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">Visitor Self Entry</CardTitle>
        </div>
        <CardDescription className="text-center">Please fill in your details to generate an entry token.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="visitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Full Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Jane Doe" {...field} className="pl-10" />
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
                            <SelectValue placeholder="Select purpose" />
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
                      <Textarea placeholder="e.g., Number of accompanying persons" {...field} />
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
