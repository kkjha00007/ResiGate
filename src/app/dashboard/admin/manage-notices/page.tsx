'use client';
import { CreateNoticeForm } from '@/components/dashboard/admin/CreateNoticeForm';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { NoticesTable } from '@/components/dashboard/admin/NoticesTable';
import { Separator } from '@/components/ui/separator';

export default function ManageNoticesPage() {
  const { user, isLoading, isAdmin, isSocietyAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin() && !isSocietyAdmin()))) {
      router.replace('/no-access');
      return;
    }
  }, [user, isLoading, isAdmin, isSocietyAdmin, router]);

  if (isLoading || !user || (!isAdmin() && !isSocietyAdmin())) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CreateNoticeForm />
      <Separator />
      <NoticesTable />
    </div>
  );
}
