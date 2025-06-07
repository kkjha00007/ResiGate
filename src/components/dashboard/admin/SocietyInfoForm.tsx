// src/components/dashboard/admin/SocietyInfoForm.tsx
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
import { useAuth } from '@/lib/auth-provider';
import React, { useEffect, useState } from 'react';
import type { SocietyInfoSettings } from '@/lib/types';
import { Save, Info, Hash, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const societyInfoSchema = z.object({
  societyName: z.string().min(3, 'Society Name must be at least 3 characters.').max(100, 'Society Name must not exceed 100 characters.'),
  registrationNumber: z.string().max(50, 'Registration Number must not exceed 50 characters.').optional(),
  address: z.string().max(500, 'Address must not exceed 500 characters.').optional(),
  contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  contactPhone: z.string().regex(/^$|^\+?[\d\s-]{7,20}$/, 'Invalid phone number format.').optional(),
  pincode: z.string().min(5, 'Pincode must be at least 5 digits.').max(10, 'Pincode must not exceed 10 digits.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
});

type SocietyInfoFormValues = z.infer<typeof societyInfoSchema>;

export function SocietyInfoForm() {
  const { societyInfo, fetchSocietyInfo, updateSocietyInfo, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCityStateLocked, setIsCityStateLocked] = useState(false);

  const form = useForm<SocietyInfoFormValues>({
    resolver: zodResolver(societyInfoSchema),
    defaultValues: {
      societyName: '',
      registrationNumber: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      pincode: '',
      city: '',
      state: '',
    },
  });

  useEffect(() => {
    setIsFetching(true);
    fetchSocietyInfo().finally(() => setIsFetching(false));
  }, [fetchSocietyInfo]);

  useEffect(() => {
    if (societyInfo) {
      form.reset({
        societyName: societyInfo.societyName || '',
        registrationNumber: societyInfo.registrationNumber || '',
        address: societyInfo.address || '',
        contactEmail: societyInfo.contactEmail || '',
        contactPhone: societyInfo.contactPhone || '',
        pincode: societyInfo.pincode || '',
        city: societyInfo.city || '',
        state: societyInfo.state || '',
      });
    }
  }, [societyInfo, form]);

  const onSubmit = async (data: SocietyInfoFormValues) => {
    setIsSubmitting(true);
    await updateSocietyInfo(data);
    setIsSubmitting(false);
    // Toast is handled by updateSocietyInfo in AuthProvider
  };

  const handlePincodeLookup = async () => {
    const pincode = form.getValues('pincode');
    if (!pincode || pincode.length < 5) {
      toast({ title: 'Invalid Pincode', description: 'Please enter a valid pincode before lookup.', variant: 'destructive' });
      return;
    }
    setIsLookingUp(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        form.setValue('city', postOffice.District || '');
        form.setValue('state', postOffice.State || '');
        setIsCityStateLocked(true);
      } else {
        toast({ title: 'Lookup Failed', description: 'No results found for this pincode.', variant: 'destructive' });
        setIsCityStateLocked(false);
      }
    } catch (e) {
      toast({ title: 'Lookup Error', description: 'Failed to fetch city/state from pincode.', variant: 'destructive' });
      setIsCityStateLocked(false);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleResetCityState = () => {
    form.setValue('city', '');
    form.setValue('state', '');
    setIsCityStateLocked(false);
  };

  if (authLoading || isFetching) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="societyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Society Name *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter society name" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="e.g., S/12345/2023" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Society Address (Optional)</FormLabel>
              <FormControl>
                 <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea placeholder="Full society address" {...field} rows={3} className="pl-10"/>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="e.g., contact@society.com" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="tel" placeholder="e.g., +91-1234567890" {...field} className="pl-10" />
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
                  <Button type="button" variant="outline" size="sm" onClick={handlePincodeLookup} disabled={isLookingUp || isCityStateLocked}>
                    {isLookingUp ? 'Looking up...' : 'Auto-Fill'}
                  </Button>
                  {isCityStateLocked && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleResetCityState}>
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
                <Input placeholder="e.g., Pune" {...field} disabled={isCityStateLocked} />
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
                <Input placeholder="e.g., Maharashtra" {...field} disabled={isCityStateLocked} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </form>
    </Form>
  );
}
