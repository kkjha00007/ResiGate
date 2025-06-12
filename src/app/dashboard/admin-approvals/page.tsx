'use client';
import { AdminApprovalTable } from '@/components/dashboard/AdminApprovalTable';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminApprovalsPage() {
  const { user, isLoading, isAdmin, isSocietyAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin() && !isSocietyAdmin()))) {
      router.replace('/no-access');
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
    <div className="space-y-6">
      <AdminApprovalTable />
    </div>
  );
}
