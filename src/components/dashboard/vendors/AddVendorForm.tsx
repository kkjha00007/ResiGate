
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
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { VENDOR_CATEGORIES } from '@/lib/constants';
import type { Vendor, VendorCategory } from '@/lib/types';
import { Store, User, Phone, MapPin, ListChecks, Send, StickyNote, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';

const addVendorSchema = z.object({
  name: z.string().min(2, { message: 'Vendor name must be at least 2 characters.' }).max(100, "Max 100 chars"),
  category: z.enum(VENDOR_CATEGORIES, { required_error: 'Category is required.' }),
  contactPerson: z.string().optional(),
  phoneNumber: z.string().regex(/^\d{10}$/, { message: 'Primary phone number must be 10 digits.' }),
  alternatePhoneNumber: z.string().regex(/^$|^\d{10}$/, { message: 'Alternate phone number must be 10 digits or empty.' }).optional(),
  address: z.string().optional(),
  servicesOffered: z.string().min(5, { message: 'Services offered must be at least 5 characters.' }).max(500, "Max 500 chars"),
  notes: z.string().max(500, "Max 500 chars").optional(),
});

type AddVendorFormValues = z.infer<typeof addVendorSchema>;

export function AddVendorForm() {
  const { user, submitNewVendor } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddVendorFormValues>({
    resolver: zodResolver(addVendorSchema),
    defaultValues: {
      name: '',
      category: undefined,
      contactPerson: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      address: '',
      servicesOffered: '',
      notes: '',
    },
  });

  const onSubmit = async (data: AddVendorFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const result = await submitNewVendor({
        ...data,
        category: data.category as VendorCategory, // Ensure type compatibility
    });

    if (result) {
      toast({
        title: 'Vendor Submitted',
        description: `${result.name} has been submitted for approval.`,
      });
      form.reset();
      router.push('/dashboard/vendors/directory'); // Redirect to directory after successful submission
    }
    // Error toast is handled by submitNewVendor in AuthProvider
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Add New Vendor</CardTitle>
            <CardDescription>Submit details of a new vendor for the society directory. It will be reviewed by an admin.</CardDescription>
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
                  <FormLabel>Vendor/Shop Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="e.g., City Electricals, Fresh Greens Groceries" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                       <div className="relative">
                        <ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select vendor category" />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {VENDOR_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contact Person (Optional)</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="e.g., Mr. Sharma" {...field} className="pl-10" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Primary Phone Number *</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="tel" placeholder="10-digit mobile number" {...field} className="pl-10" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="alternatePhoneNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Alternate Phone Number (Optional)</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="tel" placeholder="Another 10-digit number" {...field} className="pl-10" />
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
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea placeholder="Shop no, Street, Landmark, Area..." {...field} rows={3} className="pl-10"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servicesOffered"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services Offered / Speciality *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., All types of plumbing work, Sells fresh organic vegetables, Home delivery available..." {...field} rows={3} />
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
                        <Textarea placeholder="e.g., Available from 9 AM to 6 PM, Closed on Sundays, Ask for discount..." {...field} rows={2} className="pl-10"/>
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
                  <Send className="mr-2 h-4 w-4" /> Submit Vendor for Approval
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
