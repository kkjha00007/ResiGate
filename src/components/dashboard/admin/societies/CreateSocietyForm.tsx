
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

const createSocietySchema = z.object({
  name: z.string().min(3, { message: 'Society name must be at least 3 characters.' }).max(100),
  city: z.string().min(2, { message: 'City name must be at least 2 characters.' }).max(50),
});

type CreateSocietyFormValues = z.infer<typeof createSocietySchema>;

export function CreateSocietyForm() {
  const { createSociety } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateSocietyFormValues>({
    resolver: zodResolver(createSocietySchema),
    defaultValues: {
      name: '',
      city: '',
    },
  });

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
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g., Pune, Mumbai" {...field} className="pl-10" />
                  </div>
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
