// src/app/no-access/page.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function NoAccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <Image
        src="/restricted.png"
        alt="No Access"
        width={180}
        height={180}
        className="mb-6"
        priority
      />
      <h1 className="text-3xl font-bold text-destructive mb-2">Access Restricted</h1>
      <p className="text-lg text-muted-foreground mb-6 text-center max-w-md">
        You do not have permission to view this page.<br />
        If you believe this is a mistake, please contact your administrator.
      </p>
      <Link href="/dashboard">
        <span className="inline-block px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition">Go to Dashboard</span>
      </Link>
    </div>
  );
}
