'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ComplaintsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/help');
  }, [router]);
  return null;
}
