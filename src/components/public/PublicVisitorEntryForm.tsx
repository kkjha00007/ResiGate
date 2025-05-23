
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Home, ListChecks, Car, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { VISIT_PURPOSES, PUBLIC_ENTRY_SOURCE } from '@/lib/constants';
import type { VisitorEntry } from '@/lib/types';
import { Textarea } from '../ui/textarea';
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

interface EntryConfirmationDetails {
  visitorName: string;
  tokenCode: string;
  entryTimestamp: string;
}

export function PublicVisitorEntryForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryDetails, setEntryDetails] = useState<EntryConfirmationDetails | null>(null);

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

    const submissionData: Omit<VisitorEntry, 'id' | 'entryTimestamp' | 'tokenCode' | 'enteredBy'> = {
      ...data,
      // entryTimestamp and tokenCode will be set by the API
      // enteredBy will be set by the API to PUBLIC_ENTRY_SOURCE
    };

    try {
      const response = await fetch('/api/public-visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit visitor entry');
      }

      const createdEntry: { visitorName: string; tokenCode: string; entryTimestamp: string } = await response.json();
      setEntryDetails(createdEntry);
      form.reset();
      // toast({ title: 'Entry Submitted', description: `Token: ${createdEntry.tokenCode}` });
    } catch (error) {
      console.error("Failed to submit public visitor entry:", error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({ title: 'Submission Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (entryDetails) {
    return (
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <CheckCircle className="h-16 w-16 text-accent mx-auto mb-4" /> {/* Use accent color */}
          <CardTitle className="text-2xl font-bold text-primary">Entry Submitted Successfully!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Thank you, {entryDetails.visitorName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="mt-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-left shadow-sm">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-accent mr-2.5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-[0.95rem] font-semibold text-accent leading-tight">IMPORTANT: Show to Security</h3>
                <p className="mt-1 text-xs text-accent/80">
                  Please show this information to the security guard for verification.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Token Code:</p>
            <p className="text-2xl font-bold text-accent">{entryDetails.tokenCode}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Entry Time:</p>
            <p className="text-lg text-foreground">
              {format(new Date(entryDetails.entryTimestamp), 'PPpp')}
            </p>
          </div>
          <Button 
            onClick={() => setEntryDetails(null)} 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Make Another Entry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Public Visitor Entry</CardTitle>
        <CardDescription>Please fill in your details to generate an entry token. Present the token to the security guard.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

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
                'Submit & Get Token'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
