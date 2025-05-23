
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, User, Phone, Home, Car, Camera, Send, FilePlus, ListChecks } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { VISIT_PURPOSES, USER_ROLES } from '@/lib/constants'; // Added USER_ROLES
import type { VisitorEntry } from '@/lib/types';


const visitorEntrySchema = z.object({
  visitorName: z.string().min(2, { message: 'Visitor name must be at least 2 characters.' }),
  mobileNumber: z.string().regex(/^\d{10}$/, { message: 'Mobile number must be 10 digits.' }),
  flatNumber: z.string().min(1, { message: 'Flat number is required.' }),
  purposeOfVisit: z.enum(VISIT_PURPOSES, { required_error: 'Purpose of visit is required.' }),
  vehicleNumber: z.string().optional(),
  visitorPhoto: z.instanceof(FileList).optional(), 
  notes: z.string().optional(),
});

type VisitorEntryFormValues = z.infer<typeof visitorEntrySchema>;

export function VisitorEntryForm() {
  const { user, fetchVisitorEntries, isResident } = useAuth(); 
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryDateTime, setEntryDateTime] = useState(new Date()); 

  const form = useForm<VisitorEntryFormValues>({
    resolver: zodResolver(visitorEntrySchema),
    defaultValues: {
      visitorName: '',
      mobileNumber: '',
      flatNumber: user?.flatNumber && isResident() ? user.flatNumber : '', // Pre-fill if resident
      purposeOfVisit: undefined,
      vehicleNumber: '',
      notes: '',
    },
  });

  useEffect(() => {
    // If user is a resident and has a flat number, set it and potentially disable field
    if (user?.flatNumber && isResident()) {
      form.setValue('flatNumber', user.flatNumber);
    }
  }, [user, form, isResident]);


  const onSubmit = async (data: VisitorEntryFormValues) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to submit entries.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    let visitorPhotoUrl: string | undefined = undefined;
    if (data.visitorPhoto && data.visitorPhoto.length > 0) {
      visitorPhotoUrl = `https://placehold.co/400x400.png?text=${encodeURIComponent(data.visitorName.substring(0,2).toUpperCase())}`;
      toast({ title: 'Photo "Handling"', description: 'Photo upload is mocked. Using placeholder.' });
    }

    const submissionData: Omit<VisitorEntry, 'id' | 'entryTimestamp' | 'tokenCode' | 'enteredBy'> & { visitorPhotoUrl?: string } = {
      ...data,
      visitorPhotoUrl,
      enteredBy: user.id, // Logged in user is making this entry
    };
    delete (submissionData as any).visitorPhoto;


    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add visitor entry');
      }

      toast({ title: 'Visitor Entry Added', description: `${data.visitorName} has been logged.` });
      form.reset({ 
        visitorName: '',
        mobileNumber: '',
        flatNumber: user?.flatNumber && isResident() ? user.flatNumber : '', // Reset with pre-fill
        purposeOfVisit: undefined,
        vehicleNumber: '',
        notes: '',
        visitorPhoto: undefined,
      });
      setEntryDateTime(new Date()); 
      await fetchVisitorEntries(); 
    } catch (error) {
      console.error("Failed to submit visitor entry:", error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({ title: 'Submission Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isFlatNumberDisabled = !!(user?.flatNumber && isResident());

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <FilePlus className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">New Visitor Entry</CardTitle>
        </div>
        <CardDescription>Fill in the details of the visitor. Fields marked with * are required. Entry time is recorded automatically.</CardDescription>
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
                    <FormLabel>Visitor Name *</FormLabel>
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
                    <FormLabel>Mobile Number *</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="flatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flat Number *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="e.g., A-101" 
                          {...field} 
                          className="pl-10" 
                          disabled={isFlatNumberDisabled} 
                          readOnly={isFlatNumberDisabled}
                        />
                      </div>
                    </FormControl>
                    {isFlatNumberDisabled && <FormDescription>Your flat number is auto-filled.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem className="flex flex-col">
                <FormLabel>Entry Date & Time (Recorded Automatically)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        disabled 
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !entryDateTime && "text-muted-foreground"
                        )}
                      >
                        {entryDateTime ? (
                          format(entryDateTime, "PPP HH:mm")
                        ) : (
                          <span>Current date and time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={entryDateTime}
                      onSelect={(date) => {
                        if (date) {
                          const currentTime = entryDateTime || new Date();
                          date.setHours(currentTime.getHours());
                          date.setMinutes(currentTime.getMinutes());
                          setEntryDateTime(date);
                        }
                      }}
                      disabled 
                      initialFocus
                    />
                     <div className="p-2 border-t border-border">
                        <Input 
                          type="time"
                          className="mt-1"
                          disabled 
                          value={entryDateTime ? format(entryDateTime, "HH:mm") : format(new Date(), "HH:mm")}
                          onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = entryDateTime ? new Date(entryDateTime) : new Date();
                              newDate.setHours(hours);
                              newDate.setMinutes(minutes);
                              setEntryDateTime(newDate);
                          }}
                          />
                      </div>
                  </PopoverContent>
                </Popover>
                <FormDescription>Entry time is set automatically by the server upon submission.</FormDescription>
              </FormItem>
            </div>
            
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
                   <FormDescription>
                    Select the primary reason for the visit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="visitorPhoto"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Visitor Photo (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => onChange(e.target.files)}
                          className="pl-10 file:text-sm file:font-medium file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:py-1 file:px-2 hover:file:bg-primary/20"
                          {...rest}
                        />
                      </div>
                    </FormControl>
                     <FormDescription>Upload a clear photo of the visitor if available.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                 <Send className="mr-2 h-5 w-5" /> Submit Entry
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
