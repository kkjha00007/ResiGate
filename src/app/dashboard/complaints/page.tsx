
'use client';

import { ComplaintForm } from '@/components/dashboard/complaints/ComplaintForm';
import { MyComplaintsList } from '@/components/dashboard/complaints/MyComplaintsList';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ComplaintsPage() {
  const { user, isLoading, isOwnerOrRenter } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isOwnerOrRenter())) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, isOwnerOrRenter, router]);

  if (isLoading || !user || !isOwnerOrRenter()) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ComplaintForm />
      <Separator />
      <MyComplaintsList />
    </div>
  );
}
