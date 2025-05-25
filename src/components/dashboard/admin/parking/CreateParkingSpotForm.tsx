
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-provider';
import { PARKING_SPOT_TYPES } from '@/lib/constants';
import type { ParkingSpotType } from '@/lib/types';
import { ParkingSquare, Car, Bike, MapPin, StickyNote, Send } from 'lucide-react';
import React, { useState } from 'react';

const createParkingSpotSchema = z.object({
  spotNumber: z.string().min(1, { message: 'Spot number is required.' }).max(20, "Max 20 chars"),
  type: z.enum(PARKING_SPOT_TYPES, { required_error: 'Parking spot type is required.' }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }).max(100, "Max 100 chars"),
  notes: z.string().max(200, "Max 200 chars").optional(),
});

type CreateParkingSpotFormValues = z.infer<typeof createParkingSpotSchema>;

export function CreateParkingSpotForm() {
  const { createParkingSpot } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateParkingSpotFormValues>({
    resolver: zodResolver(createParkingSpotSchema),
    defaultValues: {
      spotNumber: '',
      type: undefined,
      location: '',
      notes: '',
    },
  });

  const onSubmit = async (data: CreateParkingSpotFormValues) => {
    setIsSubmitting(true);
    const result = await createParkingSpot({
      ...data,
      type: data.type as ParkingSpotType,
    });
    if (result) {
      form.reset();
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ParkingSquare className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">Define New Parking Spot</CardTitle>
            <CardDescription>Add a new parking spot to the society's inventory.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="spotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spot Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A-01, B-102, P1-C05" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spot Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type (Car/Bike)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PARKING_SPOT_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="capitalize">
                            <div className="flex items-center gap-2">
                              {type === 'car' ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Wing *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Basement 1, Tower A, Open Area near Gate 2" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea placeholder="e.g., Compact cars only, Near elevator, Covered" {...field} className="pl-10" rows={3} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Add Parking Spot
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
