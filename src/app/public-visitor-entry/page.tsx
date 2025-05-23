import { PublicVisitorEntryForm } from '@/components/public/PublicVisitorEntryForm';
import { APP_NAME } from '@/lib/constants';
import { ShieldCheck } from 'lucide-react';

export default function PublicVisitorEntryPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4 py-12">
      <div className="flex flex-col items-center mb-8">
        <ShieldCheck className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold text-primary">{APP_NAME}</h1>
        <p className="text-lg text-foreground mt-1">Public Visitor Entry</p>
      </div>
      <PublicVisitorEntryForm />
    </div>
  );
}
