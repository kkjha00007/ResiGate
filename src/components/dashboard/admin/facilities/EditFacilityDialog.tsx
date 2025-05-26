
// src/components/dashboard/admin/facilities/EditFacilityDialog.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
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
import React, { useEffect, useState } from 'react';
import type { Facility } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Building, FileText, Save, Users, Info, Edit3 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const editFacilitySchema = z.object({
  name: z.string().min(3, { message: 'Facility name must be at least 3 characters.' }).max(100),
  description: z.string().max(500).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  bookingRules: z.string().max(1000).optional(),
  isActive: z.boolean(),
});

type EditFacilityFormValues = z.infer<typeof editFacilitySchema>;

interface EditFacilityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  facility: Facility;
}

export function EditFacilityDialog({
  isOpen,
  onOpenChange,
  facility,
}: EditFacilityDialogProps) {
  const { updateFacility } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditFacilityFormValues>({
    resolver: zodResolver(editFacilitySchema),
    defaultValues: {
      name: facility.name || '',
      description: facility.description || '',
      capacity: facility.capacity || undefined,
      bookingRules: facility.bookingRules || '',
      isActive: facility.isActive,
    },
  });

  useEffect(() => {
    if (facility && isOpen) {
      form.reset({
        name: facility.name,
        description: facility.description || '',
        capacity: facility.capacity || undefined,
        bookingRules: facility.bookingRules || '',
        isActive: facility.isActive,
      });
    }
  }, [facility, form, isOpen]);

  const handleSubmit = async (data: EditFacilityFormValues) => {
    setIsSubmitting(true);
    const result = await updateFacility(facility.id, data);
    if (result) {
      onOpenChange(false); // Close dialog on success
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Edit3 className="h-5 w-5" /> Edit Facility: {facility.name}
          </DialogTitle>
          <DialogDescription>Update the details for this facility.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Clubhouse" {...field} />
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
                    <Textarea placeholder="A brief description of the facility..." {...field} rows={3}/>
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
                        <Textarea placeholder="e.g., Max 2 hours booking..." {...field} rows={4} className="pl-10"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Active for Booking</FormLabel>
                        <FormMessage />
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
             />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                ) : (
                   <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
