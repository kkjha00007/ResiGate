"use client";

import React, { Suspense } from 'react';
import { APP_NAME } from '@/lib/constants';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import VoiceVisitorEntry from '@/components/dashboard/VoiceVisitorEntry';

export default function PublicVoiceVisitorEntryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PublicVoiceVisitorEntryPageContent />
    </Suspense>
  );
}

function PublicVoiceVisitorEntryPageContent() {
  const searchParams = useSearchParams();
  const societyId = searchParams.get('societyId');
  const mainEntryHref = societyId
    ? `/public-visitor-entry?societyId=${encodeURIComponent(societyId)}`
    : '/public-visitor-entry';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4 py-12">
      <div className="flex flex-col items-center mb-8">
        <ShieldCheck className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold text-primary">{APP_NAME}</h1>
        <p className="text-lg text-foreground mt-1">Public Visitor Entry</p>
        <Link href={mainEntryHref} className="mt-4">
          <Button size="lg" className="bg-primary text-white shadow-lg">
            Standard Entry (Form)
          </Button>
        </Link>
      </div>
      <VoiceVisitorEntry />
    </div>
  );
}
