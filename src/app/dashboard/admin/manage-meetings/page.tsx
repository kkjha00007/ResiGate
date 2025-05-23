
'use client';
import { CreateMeetingForm } from '@/components/dashboard/admin/CreateMeetingForm';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
// Import a MeetingsTable component if you create one for managing meetings
// import { MeetingsTable } from '@/components/dashboard/admin/MeetingsTable';

export default function ManageMeetingsPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin())) {
      router.replace('/dashboard'); 
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading || !user || !isAdmin()) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CreateMeetingForm />
      {/* 
      <Separator />
      <MeetingsTable /> // Placeholder for when you implement meeting management table
      */}
    </div>
  );
}
