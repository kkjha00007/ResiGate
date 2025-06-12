import { VisitorEntryForm } from '@/components/dashboard/VisitorEntryForm';
import VoiceVisitorEntry from '@/components/dashboard/VoiceVisitorEntry';

export default function AddVisitorPage() {
  return (
    <div className="container mx-auto py-4 flex flex-col gap-8">
      <VisitorEntryForm />
      <VoiceVisitorEntry />
    </div>
  );
}
