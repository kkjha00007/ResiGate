
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parse, set } from 'date-fns';
import { CalendarIcon, Clock, MapPin, FileText, Send, UsersRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';

const meetingFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(100, "Max 100 chars"),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(1000, "Max 1000 chars"),
  meetingDate: z.date({ required_error: 'Meeting date is required.' }),
  meetingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)."}),
  locationOrLink: z.string().min(3, { message: 'Location or link must be at least 3 characters.' }).max(200, "Max 200 chars"),
});

type MeetingFormValues = z.infer<typeof meetingFormSchema>;

export function CreateMeetingForm() {
  const { user, createMeeting } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      meetingDate: undefined,
      meetingTime: '', // e.g., "10:30"
      locationOrLink: '',
    },
  });

  const onSubmit = async (data: MeetingFormValues) => {
    if (!user || user.role !== 'superadmin') {
      toast({ title: 'Unauthorized', description: 'You do not have permission to create meetings.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    const [hours, minutes] = data.meetingTime.split(':').map(Number);
    const combinedDateTime = set(data.meetingDate, { hours, minutes });

    if (isNaN(combinedDateTime.getTime())) {
        toast({ title: 'Invalid Date/Time', description: 'The provided date or time is invalid.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }
    
    const result = await createMeeting({
      title: data.title,
      description: data.description,
      dateTime: combinedDateTime.toISOString(), // Send as ISO string
      locationOrLink: data.locationOrLink,
    });

    if (result) {
      form.reset();
      // Toast is handled by createMeeting function in AuthProvider
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <UsersRound className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Schedule New Meeting</CardTitle>
            <CardDescription>Set up a new meeting for society members.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title *</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g., Monthly Committee Meeting" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Description / Agenda *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about the meeting agenda, topics to be discussed, etc."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="meetingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Meeting Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meetingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Time (HH:MM) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="time" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="locationOrLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Online Meeting Link *</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g., Community Hall OR https://meet.example.com/xyz" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Schedule Meeting
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
