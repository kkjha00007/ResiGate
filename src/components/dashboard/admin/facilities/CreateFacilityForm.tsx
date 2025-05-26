
// src/components/dashboard/admin/facilities/CreateFacilityForm.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-provider';
import React, { useState } from 'react';
import { Building, FileText, Send, Users, Info } from 'lucide-react';

const facilityFormSchema = z.object({
  name: z.string().min(3, { message: 'Facility name must be at least 3 characters.' }).max(100),
  description: z.string().max(500).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  bookingRules: z.string().max(1000).optional(),
});

type FacilityFormValues = z.infer<typeof facilityFormSchema>;

export function CreateFacilityForm() {
  const { createFacility } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      name: '',
      description: '',
      capacity: undefined,
      bookingRules: '',
    },
  });

  const onSubmit = async (data: FacilityFormValues) => {
    setIsSubmitting(true);
    const result = await createFacility(data);
    if (result) {
      form.reset();
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Add New Facility</CardTitle>
            <CardDescription>Define a new facility available for booking in the society.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Clubhouse, Swimming Pool, Tennis Court" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the facility and its amenities." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="e.g., 50" {...field} value={field.value ?? ""} className="pl-10"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bookingRules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Rules/Notes (Optional)</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea placeholder="e.g., Max 2 hours booking, No outside food allowed, Cleaning charges apply." {...field} rows={4} className="pl-10"/>
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
                  <Send className="mr-2 h-4 w-4" /> Add Facility
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
