
'use client';

import React, { useEffect, useState } from 'react';
import type { Notice } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Eye, Trash2, Edit3, ToggleLeft, ToggleRight, ListOrdered, AlertTriangle, ScrollText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const editNoticeSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must not exceed 100 characters"),
  content: z.string().min(20, "Content must be at least 20 characters").max(2000, "Content must not exceed 2000 characters"),
});
type EditNoticeFormValues = z.infer<typeof editNoticeSchema>;


export function NoticesTable() {
  const { allNoticesForAdmin, fetchAllNoticesForAdmin, updateNotice, deleteNotice, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Stores ID of notice being processed
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const form = useForm<EditNoticeFormValues>({
    resolver: zodResolver(editNoticeSchema),
    defaultValues: {
      title: '',
      content: '',
    }
  });
  
  useEffect(() => {
    fetchAllNoticesForAdmin();
  }, [fetchAllNoticesForAdmin]);

  useEffect(() => {
    if (editingNotice) {
      form.reset({
        title: editingNotice.title,
        content: editingNotice.content,
      });
    }
  }, [editingNotice, form]);


  const handleToggleActive = async (notice: Notice) => {
    setIsProcessing(notice.id);
    await updateNotice(notice.id, notice.monthYear, { isActive: !notice.isActive });
    setIsProcessing(null);
  };

  const handleDelete = async (notice: Notice) => {
    setIsProcessing(notice.id);
    await deleteNotice(notice.id, notice.monthYear);
    setIsProcessing(null);
  };
  
  const handleEditSubmit = async (values: EditNoticeFormValues) => {
    if (!editingNotice) return;
    setIsProcessing(editingNotice.id);
    await updateNotice(editingNotice.id, editingNotice.monthYear, { title: values.title, content: values.content });
    setIsProcessing(null);
    setEditingNotice(null); // Close dialog
  };


  if (authLoading && allNoticesForAdmin.length === 0) {
    return (
      <div className="flex h-[calc(50vh)] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading notices...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ListOrdered className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Manage Notices</CardTitle>
            <CardDescription>View, edit, activate/deactivate, and delete society notices.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {allNoticesForAdmin.length === 0 ? (
          <div className="text-center py-10">
             <ScrollText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notices have been posted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Posted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allNoticesForAdmin.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="font-medium">{notice.title}</TableCell>
                    <TableCell>{format(parseISO(notice.createdAt), 'PPpp')}</TableCell>
                    <TableCell>{notice.postedByName}</TableCell>
                    <TableCell>
                      <Badge variant={notice.isActive ? 'default' : 'outline'} className={notice.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'}>
                        {notice.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       {/* Edit Dialog Trigger */}
                       <Dialog onOpenChange={(open) => { if (!open) setEditingNotice(null); else setEditingNotice(notice); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700" disabled={isProcessing === notice.id}>
                            <Edit3 className="mr-1 h-4 w-4" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] md:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Edit Notice</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4 py-4">
                              <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl><Textarea rows={6} {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isProcessing === notice.id}>
                                 {isProcessing === notice.id ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(notice)}
                        disabled={isProcessing === notice.id}
                        className={notice.isActive ? "text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700" : "text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"}
                      >
                        {isProcessing === notice.id ? (
                           <div className="animate-spin rounded-full h-4 w-4 border-b-1 border-current"></div>
                        ) : (
                          notice.isActive ? <ToggleLeft className="mr-1 h-4 w-4" /> : <ToggleRight className="mr-1 h-4 w-4" />
                        )}
                        {notice.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isProcessing === notice.id}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete the notice titled "<strong>{notice.title}</strong>"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(notice)}
                              className="bg-destructive hover:bg-destructive/90"
                              disabled={isProcessing === notice.id}
                            >
                             {isProcessing === notice.id ? 'Deleting...' : 'Confirm Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
