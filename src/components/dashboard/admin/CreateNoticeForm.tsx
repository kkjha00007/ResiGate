
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { USER_ROLES } from '@/lib/constants';
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
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { ClipboardEdit, Send, FileText } from 'lucide-react';

const noticeFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(100, { message: 'Title must not exceed 100 characters.' }),
  content: z.string().min(20, { message: 'Content must be at least 20 characters.' }).max(2000, { message: 'Content must not exceed 2000 characters.' }),
});

type NoticeFormValues = z.infer<typeof noticeFormSchema>;

export function CreateNoticeForm() {
  const { user, createNotice } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = async (data: NoticeFormValues) => {
    if (!user || user.primaryRole !== USER_ROLES.OWNER_APP) {
      toast({ title: 'Unauthorized', description: 'You do not have permission to create notices.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const result = await createNotice(data);

    if (result) {
      form.reset();
      // Toast is handled by createNotice function in AuthProvider
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ClipboardEdit className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Create New Notice</CardTitle>
            <CardDescription>Post a new notice or announcement for all society members.</CardDescription>
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
                  <FormLabel>Notice Title *</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g., Urgent Water Supply Disruption" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notice Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide the full details of the notice..."
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Min 20 characters, Max 2000 characters. Supports basic Markdown for formatting (e.g., **bold**, *italic*).
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
                  <Send className="mr-2 h-4 w-4" /> Post Notice
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
