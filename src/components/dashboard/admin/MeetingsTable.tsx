
'use client';

import React, { useEffect, useState } from 'react';
import type { Meeting } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, set } from 'date-fns';
import { Eye, Trash2, Edit3, ToggleLeft, ToggleRight, ListOrdered, AlertTriangle, UsersRound, CalendarIcon, Clock, MapPin, FileTextIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';


const editMeetingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Max 100 chars"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Max 1000 chars"),
  meetingDate: z.date({ required_error: 'Meeting date is required.' }),
  meetingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)."}),
  locationOrLink: z.string().min(3, "Location/link must be at least 3 characters").max(200, "Max 200 chars"),
});
type EditMeetingFormValues = z.infer<typeof editMeetingSchema>;


export function MeetingsTable() {
  const { allMeetingsForAdmin, fetchAllMeetingsForAdmin, updateMeeting, deleteMeeting, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null); 
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  const form = useForm<EditMeetingFormValues>({
    resolver: zodResolver(editMeetingSchema),
    defaultValues: {
      title: '',
      description: '',
      meetingDate: new Date(),
      meetingTime: '',
      locationOrLink: '',
    }
  });
  
  useEffect(() => {
    fetchAllMeetingsForAdmin();
  }, [fetchAllMeetingsForAdmin]);

  useEffect(() => {
    if (editingMeeting) {
      const meetingDateTime = parseISO(editingMeeting.dateTime);
      form.reset({
        title: editingMeeting.title,
        description: editingMeeting.description,
        meetingDate: meetingDateTime,
        meetingTime: format(meetingDateTime, "HH:mm"),
        locationOrLink: editingMeeting.locationOrLink,
      });
    }
  }, [editingMeeting, form]);


  const handleToggleActive = async (meeting: Meeting) => {
    setIsProcessing(meeting.id);
    await updateMeeting(meeting.id, meeting.monthYear, { isActive: !meeting.isActive });
    setIsProcessing(null);
  };

  const handleDelete = async (meeting: Meeting) => {
    setIsProcessing(meeting.id);
    await deleteMeeting(meeting.id, meeting.monthYear);
    setIsProcessing(null);
  };
  
  const handleEditSubmit = async (values: EditMeetingFormValues) => {
    if (!editingMeeting) return;

    const [hours, minutes] = values.meetingTime.split(':').map(Number);
    const combinedDateTime = set(values.meetingDate, { hours, minutes });

    if (isNaN(combinedDateTime.getTime())) {
        form.setError("meetingTime", { type: "manual", message: "Invalid combined date/time."});
        return;
    }

    setIsProcessing(editingMeeting.id);
    await updateMeeting(editingMeeting.id, editingMeeting.monthYear, { 
      title: values.title, 
      description: values.description,
      dateTime: combinedDateTime.toISOString(),
      locationOrLink: values.locationOrLink,
    });
    setIsProcessing(null);
    setEditingMeeting(null); 
  };


  if (authLoading && allMeetingsForAdmin.length === 0) {
    return (
      <div className="flex h-[calc(50vh)] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading meetings...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ListOrdered className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Manage Meetings</CardTitle>
            <CardDescription>View, edit, activate/deactivate, and delete society meetings.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {allMeetingsForAdmin.length === 0 ? (
          <div className="text-center py-10">
             <UsersRound className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No meetings have been scheduled yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location/Link</TableHead>
                  <TableHead>Posted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMeetingsForAdmin.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.title}</TableCell>
                    <TableCell>{format(parseISO(meeting.dateTime), 'PPpp')}</TableCell>
                    <TableCell className="truncate max-w-xs">{meeting.locationOrLink}</TableCell>
                    <TableCell>{meeting.postedByName}</TableCell>
                    <TableCell>
                      <Badge variant={meeting.isActive ? 'default' : 'outline'} className={meeting.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'}>
                        {meeting.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Dialog onOpenChange={(open) => { if (!open) setEditingMeeting(null); else setEditingMeeting(meeting); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700" disabled={isProcessing === meeting.id}>
                            <Edit3 className="mr-1 h-4 w-4" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg md:max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Edit Meeting</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                              <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <FileTextIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input {...field} className="pl-10"/>
                                        </div>
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea rows={4} {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="meetingDate"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Meeting Date</FormLabel>
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
                                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
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
                                    name="meetingTime"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Meeting Time (HH:MM)</FormLabel>
                                        <FormControl>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="time" {...field} className="pl-10" />
                                        </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                              </div>
                               <FormField
                                control={form.control}
                                name="locationOrLink"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Location / Online Meeting Link</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input {...field} className="pl-10" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter className="pt-4">
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isProcessing === meeting.id}>
                                 {isProcessing === meeting.id ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(meeting)}
                        disabled={isProcessing === meeting.id}
                        className={meeting.isActive ? "text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700" : "text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"}
                      >
                        {isProcessing === meeting.id ? (
                           <div className="animate-spin rounded-full h-4 w-4 border-b-1 border-current"></div>
                        ) : (
                          meeting.isActive ? <ToggleLeft className="mr-1 h-4 w-4" /> : <ToggleRight className="mr-1 h-4 w-4" />
                        )}
                        {meeting.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isProcessing === meeting.id}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete the meeting titled "<strong>{meeting.title}</strong>" scheduled for {format(parseISO(meeting.dateTime), 'PPp')}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(meeting)}
                              className="bg-destructive hover:bg-destructive/90"
                              disabled={isProcessing === meeting.id}
                            >
                             {isProcessing === meeting.id ? 'Deleting...' : 'Confirm Delete'}
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
