
// src/components/layout/AppFooter.tsx
import React from 'react';
import { APP_NAME } from '@/lib/constants';
import { Heart } from 'lucide-react';

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t bg-card">
      <p>
        {APP_NAME} © {currentYear} | Made in India with <Heart className="inline-block h-3 w-3 text-red-500 fill-red-500" />
      </p>
    </footer>
  );
}
