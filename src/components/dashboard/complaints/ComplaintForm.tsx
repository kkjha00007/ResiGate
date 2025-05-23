
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
import { COMPLAINT_CATEGORIES_LIST } from '@/lib/constants';
import type { ComplaintCategory } from '@/lib/types';
import { Megaphone, Send, ListFilter, FileText } from 'lucide-react';

const complaintFormSchema = z.object({
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(100, { message: 'Subject must not exceed 100 characters.' }),
  category: z.enum(COMPLAINT_CATEGORIES_LIST, {
    required_error: 'Please select a complaint category.',
  }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }).max(1000, { message: 'Description must not exceed 1000 characters.' }),
});

type ComplaintFormValues = z.infer<typeof complaintFormSchema>;

export function ComplaintForm() {
  const { user, submitComplaint } = useAuth();
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
      toast({ title: 'Authentication Error', description: 'You must be logged in to submit a complaint.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const result = await submitComplaint({
      subject: data.subject,
      category: data.category as ComplaintCategory,
      description: data.description,
    });

    if (result) {
      form.reset();
      // Toast is handled by submitComplaint function in AuthProvider
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Submit a New Complaint</CardTitle>
            <CardDescription>Report any issues or concerns you have regarding the society.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
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
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <div className="relative">
                            <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SelectTrigger className="pl-10">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                        </div>
                    </FormControl>
                    <SelectContent>
                      {COMPLAINT_CATEGORIES_LIST.map((category) => (
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide as much detail as possible about the issue, including location, date, time, and any other relevant information."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Min 20 characters, Max 1000 characters.
                  </FormDescription>
                  <FormMessage />
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
        </Form>
      </CardContent>
    </Card>
  );
}
