
'use client';
import { PersonalLogsTable } from '@/components/dashboard/PersonalLogsTable';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PersonalLogsPage() {
  const { user, isLoading, isOwnerOrRenter } = useAuth(); // Changed from isResident
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isOwnerOrRenter())) { // Changed from isResident
      router.replace('/dashboard'); 
    }
  }, [user, isLoading, isOwnerOrRenter, router]); // Changed from isResident

  if (isLoading || !user || !isOwnerOrRenter()) { // Changed from isResident
    return (
       <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PersonalLogsTable />
    </div>
  );
}
