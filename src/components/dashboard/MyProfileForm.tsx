
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { UserCircle, KeyRound, Save, Phone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const profileDetailsSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  secondaryPhoneNumber1: z.string().regex(/^$|^\d{10}$/, { message: 'Phone number must be 10 digits or empty.' }).optional(),
  secondaryPhoneNumber2: z.string().regex(/^$|^\d{10}$/, { message: 'Phone number must be 10 digits or empty.' }).optional(),
});

type ProfileDetailsFormValues = z.infer<typeof profileDetailsSchema>;

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export function MyProfileForm() {
  const { user, updateUserProfile, changePassword, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  const profileForm = useForm<ProfileDetailsFormValues>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      name: user?.name || '',
      secondaryPhoneNumber1: user?.secondaryPhoneNumber1 || '',
      secondaryPhoneNumber2: user?.secondaryPhoneNumber2 || '',
    },
  });

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        secondaryPhoneNumber1: user.secondaryPhoneNumber1 || '',
        secondaryPhoneNumber2: user.secondaryPhoneNumber2 || '',
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileDetailsFormValues) => {
    if (!user) return;
    setIsProfileSubmitting(true);
    const result = await updateUserProfile(user.id, data);
    if (result) {
      // AuthProvider will update the user context
    }
    setIsProfileSubmitting(false);
  };

  const onPasswordSubmit = async (data: PasswordChangeFormValues) => {
    if (!user) return;
    setIsPasswordSubmitting(true);
    const success = await changePassword(user.id, data.currentPassword, data.newPassword);
    if (success) {
      passwordForm.reset();
    }
    setIsPasswordSubmitting(false);
  };
  
  if (authLoading && !user) {
    return (
     <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
     </div>
   );
 }

  if (!user) {
    return <Card><CardContent><p>Please log in to view your profile.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">My Profile</CardTitle>
              <CardDescription>View and manage your personal information and security settings.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-1">Account Information</h3>
            <div className="space-y-2 text-sm text-muted-foreground p-4 bg-secondary/30 rounded-md border">
              <p><strong>Email:</strong> {user.email}</p>
              {user.flatNumber && <p><strong>Flat Number:</strong> {user.flatNumber}</p>}
              <p><strong>Role:</strong> <span className="capitalize">{user.role}</span></p>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-3">Update Personal Details</h3>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="secondaryPhoneNumber1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family Phone Number 1 (Optional)</FormLabel>
                       <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" placeholder="10-digit number" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="secondaryPhoneNumber2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family Phone Number 2 (Optional)</FormLabel>
                       <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" placeholder="10-digit number" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
                <Button type="submit" disabled={isProfileSubmitting} className="w-full sm:w-auto">
                  {isProfileSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  ) : (
                    <>
                     <Save className="mr-2 h-4 w-4" /> Save Profile Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-3">Change Password</h3>
             <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password (min. 6 characters)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="secondary" disabled={isPasswordSubmitting} className="w-full sm:w-auto">
                   {isPasswordSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  ) : (
                    <>
                     <KeyRound className="mr-2 h-4 w-4" /> Change Password
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
