
// src/components/dashboard/security-log/ReportIncidentForm.tsx
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
import { format, parse, set, isValid } from 'date-fns';
import { CalendarIcon, Clock, MapPin, FileText, Send, ShieldAlert, AlertTriangle, Siren } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { SECURITY_INCIDENT_SEVERITIES } from '@/lib/constants';
import type { SecurityIncident, SecurityIncidentSeverity } from '@/lib/types';

const reportIncidentSchema = z.object({
  incidentDate: z.date({ required_error: 'Incident date is required.' }),
  incidentTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)."}),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }).max(150, "Max 150 chars"),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(1000, "Max 1000 chars"),
  severity: z.enum(SECURITY_INCIDENT_SEVERITIES, { required_error: 'Severity level is required.'}),
});

type ReportIncidentFormValues = z.infer<typeof reportIncidentSchema>;

export function ReportIncidentForm() {
  const { user, submitSecurityIncident } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportIncidentFormValues>({
    resolver: zodResolver(reportIncidentSchema),
    defaultValues: {
      incidentDate: new Date(), // Default to today
      incidentTime: format(new Date(), "HH:mm"), // Default to current time
      location: '',
      description: '',
      severity: undefined,
    },
  });

  const onSubmit = async (data: ReportIncidentFormValues) => {
    if (!user) {
      toast({ title: 'Unauthorized', description: 'You must be logged in to report an incident.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    const [hours, minutes] = data.incidentTime.split(':').map(Number);
    const combinedDateTime = set(data.incidentDate, { hours, minutes });

    if (!isValid(combinedDateTime)) {
        toast({ title: 'Invalid Date/Time', description: 'The provided incident date or time is invalid.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }
    
    const result = await submitSecurityIncident({
      incidentDateTime: combinedDateTime.toISOString(),
      location: data.location,
      description: data.description,
      severity: data.severity as SecurityIncidentSeverity,
    });

    if (result) {
      form.reset({
        incidentDate: new Date(),
        incidentTime: format(new Date(), "HH:mm"),
        location: '',
        description: '',
        severity: undefined,
      });
      // Toast is handled by submitSecurityIncident function in AuthProvider
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Siren className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Report Security Incident</CardTitle>
            <CardDescription>Log any security concerns or incidents observed within the society premises.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="incidentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Incident *</FormLabel>
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
                          disabled={(date) => date > new Date()} // Cannot select future dates
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
                name="incidentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time of Incident (HH:MM) *</FormLabel>
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location of Incident *</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g., Near Gate 1, Tower B Lobby, Basement Parking P2" {...field} className="pl-10" />
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
                  <FormLabel>Description of Incident *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed account of what happened, who was involved (if known), and any other relevant information."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity Level *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <div className="relative">
                            <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SelectTrigger className="pl-10">
                                <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        {SECURITY_INCIDENT_SEVERITIES.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit Report
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

