
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
import { CalendarIcon, User, Car, Send, FilePlus, ListChecks, Clock, StickyNote, TicketCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { VISIT_PURPOSES } from '@/lib/constants';
import type { GatePass } from '@/lib/types';

const gatePassSchema = z.object({
  visitorName: z.string().min(2, { message: 'Visitor name must be at least 2 characters.' }),
  expectedVisitDate: z.date({ required_error: 'Expected visit date is required.' }),
  visitDetailsOrTime: z.string().min(1, { message: 'Visit details or time is required.' }),
  purposeOfVisit: z.enum(VISIT_PURPOSES, { required_error: 'Purpose of visit is required.' }),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
});

type CreateGatePassFormValues = z.infer<typeof gatePassSchema>;

export function CreateGatePassForm() {
  const { user, createGatePass } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedPass, setGeneratedPass] = useState<GatePass | null>(null);


  const form = useForm<CreateGatePassFormValues>({
    resolver: zodResolver(gatePassSchema),
    defaultValues: {
      visitorName: '',
      expectedVisitDate: undefined,
      visitDetailsOrTime: '',
      purposeOfVisit: undefined,
      vehicleNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: CreateGatePassFormValues) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    setShowSuccess(false);
    setGeneratedPass(null);

    const submissionData = {
      ...data,
      expectedVisitDate: format(data.expectedVisitDate, 'yyyy-MM-dd'), // Format date to string
    };
    
    const result = await createGatePass(submissionData);

    if (result) {
      setGeneratedPass(result);
      setShowSuccess(true);
      form.reset();
    }
    setIsSubmitting(false);
  };

  if (showSuccess && generatedPass) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <TicketCheck className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Gate Pass Created!</CardTitle>
            <CardDescription>Your visitor gate pass has been successfully generated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm text-center">
                <p className="text-sm text-muted-foreground">Visitor Name:</p>
                <p className="text-xl font-semibold text-foreground mb-2">{generatedPass.visitorName}</p>
                <p className="text-sm text-muted-foreground">Token Code:</p>
                <p className="text-2xl font-bold text-primary tracking-wider bg-primary/10 py-2 px-4 rounded-md inline-block mb-3">{generatedPass.tokenCode}</p>
                <p className="text-sm text-muted-foreground">Expected Visit:</p>
                <p className="text-md text-foreground">{format(new Date(generatedPass.expectedVisitDate), "PPP")} - {generatedPass.visitDetailsOrTime}</p>
            </div>
            <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-lg text-left">
                <div className="flex items-start gap-3">
                    <StickyNote className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-accent">Important:</h3>
                        <p className="text-sm text-accent/90">
                            Please share the Token Code with your visitor. They will need to present this code to the security guard for verification upon arrival.
                        </p>
                    </div>
                </div>
            </div>
            <Button onClick={() => setShowSuccess(false)} className="w-full mt-6">
                Create Another Gate Pass
            </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <CalendarPlus className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">Create Visitor Gate Pass</CardTitle>
        </div>
        <CardDescription>Generate a gate pass for your upcoming visitor. They can show the token to security.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="visitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visitor Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Alice Wonderland" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="expectedVisitDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Visit Date *</FormLabel>
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
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
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
                name="visitDetailsOrTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Details / Time *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g., Around 3 PM, Evening" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                     <FormDescription>Specify expected time or duration.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                       <div className="relative">
                         <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                         <Textarea placeholder="Any other relevant information for the guard..." {...field} className="pl-10" />
                       </div>
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
                 <Send className="mr-2 h-5 w-5" /> Create Gate Pass
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
