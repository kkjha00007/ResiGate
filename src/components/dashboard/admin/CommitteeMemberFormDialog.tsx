
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import React, { useEffect, useState } from 'react';
import type { CommitteeMember } from '@/lib/types';
import { COMMITTEE_MEMBER_ROLES } from '@/lib/constants'; // Added import for roles
import { User, Briefcase, HomeIcon, Mail, Phone, Image as ImageIcon, Save, Building } from 'lucide-react';

const committeeMemberSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(100),
  roleInCommittee: z.enum(COMMITTEE_MEMBER_ROLES, {
    required_error: "Role in committee is required.",
  }),
  flatNumber: z.string().min(1, { message: 'Flat number is required.' }).max(20),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
  phone: z.string().regex(/^$|^\d{10,15}$/, { message: 'Phone number must be 10-15 digits or empty.' }).optional(),
  imageUrl: z.string().url({ message: 'Please enter a valid URL for the image or leave empty.' }).optional().or(z.literal('')),
});

type CommitteeMemberFormValues = z.infer<typeof committeeMemberSchema>;

interface CommitteeMemberFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CommitteeMemberFormValues, memberId?: string) => Promise<void>;
  initialData?: CommitteeMember | null;
}

export function CommitteeMemberFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
}: CommitteeMemberFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommitteeMemberFormValues>({
    resolver: zodResolver(committeeMemberSchema),
    defaultValues: {
      name: '',
      roleInCommittee: undefined,
      flatNumber: '',
      email: '',
      phone: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        name: initialData.name || '',
        roleInCommittee: initialData.roleInCommittee as typeof COMMITTEE_MEMBER_ROLES[number] || undefined,
        flatNumber: initialData.flatNumber || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        imageUrl: initialData.imageUrl || `https://placehold.co/200x200.png?text=${initialData.name.substring(0,2).toUpperCase()}`,
      });
    } else if (isOpen && !initialData) { // Reset to default if 'Add' mode and dialog becomes open
      form.reset({
        name: '',
        roleInCommittee: undefined,
        flatNumber: '',
        email: '',
        phone: '',
        imageUrl: '',
      });
    }
  }, [initialData, form, isOpen]);

  const handleSubmit = async (data: CommitteeMemberFormValues) => {
    setIsSubmitting(true);
    const finalData = {
      ...data,
      imageUrl: data.imageUrl || `https://placehold.co/200x200.png?text=${data.name.substring(0,2).toUpperCase()}`,
    };
    await onSubmit(finalData, initialData?.id);
    setIsSubmitting(false);
    // Dialog closing is handled by onOpenChange in parent
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-primary">
            {initialData ? 'Edit Committee Member' : 'Add New Committee Member'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details of the committee member.' : 'Enter the details for the new committee member.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Jane Doe" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleInCommittee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role in Committee *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {COMMITTEE_MEMBER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
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
              name="flatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat Number *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., A-101" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="e.g., member@example.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="tel" placeholder="e.g., 9876543210" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="https://example.com/image.png or leave for placeholder" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormDescription>If left empty, a placeholder image will be used.</FormDescription>
                  <FormMessage />
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
                {initialData ? 'Save Changes' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
