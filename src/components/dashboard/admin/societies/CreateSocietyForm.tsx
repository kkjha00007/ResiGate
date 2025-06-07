// src/components/dashboard/admin/societies/CreateSocietyForm.tsx
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
import { useAuth } from '@/lib/auth-provider';
import React, { useState } from 'react';
import { Send, Building, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const createSocietySchema = z.object({
  name: z.string().min(3, { message: 'Society name must be at least 3 characters.' }).max(100),
  pincode: z.string().min(5, { message: 'Pincode must be at least 5 digits.' }).max(10, { message: 'Pincode must not exceed 10 digits.' }),
  city: z.string().min(2, { message: 'City name must be at least 2 characters.' }).max(50),
  state: z.string().min(2, { message: 'State is required.' }),
  country: z.string().min(2, { message: 'Country is required.' }),
}).refine((data) => {
  // Simple validation: if country is India, state must be a valid Indian state (for now, just check not empty)
  if (data.country.toLowerCase() === 'india' && !data.state) return false;
  return true;
}, {
  message: 'State and country must match. Please check your entries.',
  path: ['state'],
});

type CreateSocietyFormValues = z.infer<typeof createSocietySchema>;

export function CreateSocietyForm() {
  const { createSociety } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCityStateCountryLocked, setIsCityStateCountryLocked] = useState(false);

  const form = useForm<CreateSocietyFormValues>({
    resolver: zodResolver(createSocietySchema),
    defaultValues: {
      name: '',
      pincode: '',
      city: '',
      state: '',
      country: '',
    },
  });

  // Auto-fill logic placeholder
  const handlePincodeLookup = async () => {
    const pincode = form.getValues('pincode');
    if (!pincode || pincode.length < 5) {
      toast({ title: 'Invalid Pincode', description: 'Please enter a valid pincode before lookup.', variant: 'destructive' });
      return;
    }
    setIsLookingUp(true);
    try {
      // Use India Post API for demo (works for Indian pincodes)
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        form.setValue('city', postOffice.District || '');
        form.setValue('state', postOffice.State || '');
        form.setValue('country', postOffice.Country || 'India');
        setIsCityStateCountryLocked(true);
      } else {
        toast({ title: 'Lookup Failed', description: 'No results found for this pincode.', variant: 'destructive' });
        setIsCityStateCountryLocked(false);
      }
    } catch (e) {
      toast({ title: 'Lookup Error', description: 'Failed to fetch city/state from pincode.', variant: 'destructive' });
      setIsCityStateCountryLocked(false);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleResetCityStateCountry = () => {
    form.setValue('city', '');
    form.setValue('state', '');
    form.setValue('country', '');
    setIsCityStateCountryLocked(false);
  };

  const onSubmit = async (data: CreateSocietyFormValues) => {
    setIsSubmitting(true);
    const result = await createSociety(data);
    if (result) {
      form.reset();
      // AuthProvider's createSociety handles toast and potential list refresh
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-medium text-foreground mb-4">Add New Society</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Society Name *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g., Pleasant Park Society" {...field} className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode *</FormLabel>
                <FormControl>
                  <div className="relative flex gap-2 items-center">
                    <Input placeholder="e.g., 411001" {...field} className="pl-10" maxLength={10} />
                    <Button type="button" variant="outline" size="sm" onClick={handlePincodeLookup} disabled={isLookingUp || isCityStateCountryLocked}>
                      {isLookingUp ? 'Looking up...' : 'Auto-Fill'}
                    </Button>
                    {isCityStateCountryLocked && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleResetCityStateCountry}>
                        Reset
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Pune" {...field} disabled={isCityStateCountryLocked} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Maharashtra" {...field} disabled={isCityStateCountryLocked} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., India" {...field} disabled={isCityStateCountryLocked} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Create Society
          </Button>
        </form>
      </Form>
    </div>
  );
}
