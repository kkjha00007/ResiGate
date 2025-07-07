'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-provider';
import React, { useState, useEffect } from 'react'; // Added useEffect
import { UserPlus, Eye, EyeOff, ShieldCheck } from 'lucide-react'; // Changed Building icon
import { USER_ROLES, SELECTABLE_USER_ROLES, ROLE_GROUPS } from '@/lib/constants';
import type { UserRole, Society } from '@/lib/types'; // Added Society type

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  societyId: z.string().min(1, { message: 'Please select your society.'}), // Changed from societyName to societyId
  flatNumber: z.string().min(1, { message: 'Flat number is required (e.g., A-101, NA for Guard).' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
  role: z.enum(["owner", "renter", "guard"], {
    required_error: "You need to select a user type.",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
.refine(data => data.role === 'guard' ? data.flatNumber.toUpperCase() === 'NA' : true, {
  message: "Flat number must be 'NA' for Guard role.",
  path: ["flatNumber"],
})
.refine(data => (['owner', 'renter'].includes(data.role)) ? data.flatNumber.toUpperCase() !== 'NA' && data.flatNumber.length > 0 : true, {
  message: "Flat number is required for Owner/Renter and cannot be 'NA'.",
  path: ["flatNumber"],
});


type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocietiesLoading, setIsSocietiesLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [societies, setSocieties] = useState<Society[]>([]);

  useEffect(() => {
    setIsSocietiesLoading(true);
    fetch('/api/societies')
      .then(res => res.ok ? res.json() : [])
      .then((data: Society[]) => setSocieties(data))
      .finally(() => setIsSocietiesLoading(false));
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      societyId: undefined, // Changed from societyName
      flatNumber: '',
      password: '',
      confirmPassword: '',
      role: undefined,
    },
  });

  const selectedRole = form.watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    // Map the old role names to new RBAC roles
    const roleMapping: Record<string, UserRole> = {
      'owner': 'owner_resident',
      'renter': 'renter_resident', 
      'guard': 'guard'
    };
    
    const primaryRole = roleMapping[data.role];
    
    // The API expects societyId directly, no need for societyName in submission
    const { confirmPassword, role, ...registrationData } = data;
    
    // Create user data with new RBAC structure
    const userData = {
      ...registrationData,
      primaryRole,
      roleAssociations: [{
        role: primaryRole,
        societyId: data.societyId,
        permissions: {} // Will be set by backend based on default permissions
      }]
    };
    
    await register(userData);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="text-center">
         <div className="mx-auto mb-4">
            <UserPlus stroke="hsl(var(--primary))" size={48} />
        </div>
        <CardTitle className="text-3xl font-bold text-primary">Create Your Account</CardTitle>
        <CardDescription>Register to access society features. Your account will require admin approval within your society.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="societyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Your Society</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSocietiesLoading}>
                    <FormControl>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder={isSocietiesLoading ? "Loading societies..." : "Select your society"} />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {!isSocietiesLoading && societies.length === 0 && (
                        <SelectItem value="no-societies" disabled>
                          No societies available. Contact admin.
                        </SelectItem>
                      )}
                      {societies.map((society: Society) => (
                        <SelectItem key={society.id} value={society.id}>
                          {society.name} ({society.city || 'N/A'})
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
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>I am a...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value as UserRole);
                        if (value === USER_ROLES.GUARD) {
                          form.setValue('flatNumber', 'NA');
                        } else if (form.getValues('flatNumber') === 'NA') {
                          form.setValue('flatNumber', '');
                        }
                      }}
                      value={field.value}
                      className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                    >
                      {SELECTABLE_USER_ROLES.map((roleValue) => (
                         <FormItem key={roleValue} className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={roleValue} />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {roleValue}
                            </FormLabel>
                          </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={selectedRole === USER_ROLES.GUARD ? "NA (auto-filled)" : "e.g., A-101"} 
                      {...field} 
                      disabled={selectedRole === USER_ROLES.GUARD}
                      value={selectedRole === USER_ROLES.GUARD ? 'NA' : field.value}
                    />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                  <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || isSocietiesLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" /> Register
                </>
              )}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/" className="font-medium text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
