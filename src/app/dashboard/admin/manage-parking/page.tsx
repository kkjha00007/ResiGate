
'use client';
import { CreateParkingSpotForm } from '@/components/dashboard/admin/parking/CreateParkingSpotForm';
import { ParkingSpotsTable } from '@/components/dashboard/admin/parking/ParkingSpotsTable';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

export default function ManageParkingPage() {
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
      <CreateParkingSpotForm />
      <Separator />
      <ParkingSpotsTable />
    </div>
  );
}
