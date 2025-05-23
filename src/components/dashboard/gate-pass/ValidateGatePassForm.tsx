
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-provider';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import type { GatePass } from '@/lib/types';
import { GATE_PASS_STATUSES } from '@/lib/types';
import { Search, CheckCircle, TicketCheck, ShieldAlert, Info, User, CalendarDays, Home, Car, StickyNote, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

const validateTokenSchema = z.object({
  tokenCode: z.string().min(5, { message: 'Token code must be at least 5 characters.' }),
});

type ValidateTokenFormValues = z.infer<typeof validateTokenSchema>;

export function ValidateGatePassForm() {
  const { user, fetchGatePassByToken, markGatePassUsed } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [foundPass, setFoundPass] = useState<GatePass | null>(null);

  const form = useForm<ValidateTokenFormValues>({
    resolver: zodResolver(validateTokenSchema),
    defaultValues: {
      tokenCode: '',
    },
  });

  const handleSearchToken = async (data: ValidateTokenFormValues) => {
    setIsLoading(true);
    setFoundPass(null);
    const pass = await fetchGatePassByToken(data.tokenCode.trim().toUpperCase());
    if (pass) {
      setFoundPass(pass);
    }
    // Toast messages are handled within fetchGatePassByToken
    setIsLoading(false);
  };

  const handleMarkAsUsed = async () => {
    if (!foundPass || !user) return;
    setIsProcessing(true);
    const result = await markGatePassUsed(foundPass.id, user.id);
    if (result) {
      toast({
        title: 'Gate Pass Processed',
        description: `Visitor ${result.visitorEntry.visitorName} entry created. Pass ${result.updatedPass.tokenCode} marked as used.`,
      });
      setFoundPass(result.updatedPass); // Update pass details with new status
      form.reset(); // Reset search form
    }
    // Toast messages for errors are handled within markGatePassUsed
    setIsProcessing(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <TicketCheck className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">Validate Gate Pass Token</CardTitle>
        </div>
        <CardDescription>Enter the visitor's token code to validate their pre-approved gate pass.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSearchToken)} className="space-y-6 mb-8">
            <FormField
              control={form.control}
              name="tokenCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Code</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                        <Input placeholder="Enter token code (e.g., GP-XXXXX-YYYY)" {...field} className="uppercase" />
                    </FormControl>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                      ) : (
                        <Search className="mr-2 h-5 w-5" /> 
                      )}
                      Search
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {isLoading && (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="ml-3 text-muted-foreground">Searching for pass...</p>
          </div>
        )}

        {foundPass && !isLoading && (
          <Card className="bg-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gate Pass Details
                <Badge variant={
                    foundPass.status === GATE_PASS_STATUSES.PENDING ? "secondary" :
                    foundPass.status === GATE_PASS_STATUSES.USED ? "default" :
                    foundPass.status === GATE_PASS_STATUSES.CANCELLED ? "destructive" :
                    "outline"
                  }>{foundPass.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /><strong>Visitor:</strong> {foundPass.visitorName}</div>
              <div className="flex items-center gap-2"><Home className="h-5 w-5 text-primary" /><strong>Flat No:</strong> {foundPass.residentFlatNumber}</div>
              <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><strong>Expected Date:</strong> {format(parseISO(foundPass.expectedVisitDate), "PPP")}</div>
              <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /><strong>Expected Time/Details:</strong> {foundPass.visitDetailsOrTime}</div>
              <div className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" /><strong>Purpose:</strong> {foundPass.purposeOfVisit}</div>
              {foundPass.vehicleNumber && <div className="flex items-center gap-2"><Car className="h-5 w-5 text-primary" /><strong>Vehicle No:</strong> {foundPass.vehicleNumber}</div>}
              {foundPass.notes && <div className="flex items-start gap-2"><StickyNote className="h-5 w-5 text-primary mt-1" /><strong>Notes:</strong> <p className="text-sm">{foundPass.notes}</p></div>}
              <div className="flex items-center gap-2"><strong>Token:</strong> <Badge variant="outline">{foundPass.tokenCode}</Badge></div>

              {foundPass.status === GATE_PASS_STATUSES.PENDING && (
                <Button onClick={handleMarkAsUsed} className="w-full mt-4" disabled={isProcessing}>
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  ) : (
                    <CheckCircle className="mr-2 h-5 w-5" />
                  )}
                  Mark as Used & Create Visitor Entry
                </Button>
              )}
              {foundPass.status === GATE_PASS_STATUSES.USED && (
                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" /> This pass has already been used. Visitor entry created.
                </div>
              )}
              {foundPass.status === GATE_PASS_STATUSES.CANCELLED && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> This pass has been cancelled by the resident.
                </div>
              )}
               {foundPass.status === GATE_PASS_STATUSES.EXPIRED && (
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-700 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> This pass has expired.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
