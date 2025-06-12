'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
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
import { HELP_DESK_CATEGORIES } from '@/lib/constants';
import type { ComplaintCategory } from '@/lib/types';
import { Megaphone, Send, ListFilter, FileText } from 'lucide-react';

const complaintFormSchema = z.object({
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(100, { message: 'Subject must not exceed 100 characters.' }),
  category: z.enum(HELP_DESK_CATEGORIES, {
    required_error: 'Please select a category.',
  }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }).max(1000, { message: 'Description must not exceed 1000 characters.' }),
  urgent: z.boolean().optional(),
  document: z.any().optional(),
  photo: z.any().optional(),
});

type ComplaintFormValues = z.infer<typeof complaintFormSchema>;

export interface ComplaintFormProps {
  onSuccess?: () => void;
}

export function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const { user, submitHelpDeskRequest } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      subject: '',
      category: undefined,
      description: '',
    },
  });

  const onSubmit = async (data: ComplaintFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to submit a request.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const result = await submitHelpDeskRequest({
      subject: data.subject,
      category: data.category,
      description: data.description,
      urgent: data.urgent,
      document: data.document,
      photo: data.photo,
    });
    if (result) {
      form.reset();
      if (onSuccess) onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div>
            <span className="text-lg font-bold text-blue-700">Flat: <span className="text-pink-600 text-2xl">{user?.flatNumber}</span></span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Wrap the form in FormProvider for context */}
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Water leakage in Block B staircase" {...field} className="pl-10" />
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
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {HELP_DESK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Textarea
                        placeholder="Please provide as much detail as possible about the issue, including location, date, time, and any other relevant information."
                        rows={5}
                        {...field}
                      />
                      <Button type="button" variant="ghost">
                        <Megaphone className="h-5 w-5" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Min 20 characters, Max 1000 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgent"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={field.value || false} onChange={e => field.onChange(e.target.checked)} /> Mark as urgent
                    </label>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document</FormLabel>
                  <FormControl>
                    <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={e => field.onChange(e.target.files?.[0])} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={e => field.onChange(e.target.files?.[0])} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit Complaint
                </>
              )}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

export default ComplaintForm;
