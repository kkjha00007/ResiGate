
// src/app/dashboard/committee-members/page.tsx
import { CommitteeMembersDisplay } from '@/components/dashboard/CommitteeMembersDisplay';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

// Mock data for committee members - replace with dynamic data later
const mockCommitteeMembers = [
  {
    id: 'cm1',
    name: 'Mr. Ramesh Sharma',
    roleInCommittee: 'President',
    flatNumber: 'A-301',
    imageUrl: 'https://placehold.co/200x200.png',
    email: 'president@example.com',
    phone: '9876500001',
  },
  {
    id: 'cm2',
    name: 'Mrs. Priya Patel',
    roleInCommittee: 'Secretary',
    flatNumber: 'B-102',
    imageUrl: 'https://placehold.co/200x200.png',
    email: 'secretary@example.com',
    phone: '9876500002',
  },
  {
    id: 'cm3',
    name: 'Mr. Anand Verma',
    roleInCommittee: 'Treasurer',
    flatNumber: 'C-405',
    imageUrl: 'https://placehold.co/200x200.png',
    email: 'treasurer@example.com',
    phone: '9876500003',
  },
  {
    id: 'cm4',
    name: 'Ms. Sunita Reddy',
    roleInCommittee: 'Member',
    flatNumber: 'D-202',
    imageUrl: 'https://placehold.co/200x200.png',
    email: 'member1@example.com',
    phone: '9876500004',
  },
  {
    id: 'cm5',
    name: 'Mr. Vikram Singh',
    roleInCommittee: 'Member',
    flatNumber: 'A-104',
    imageUrl: 'https://placehold.co/200x200.png',
    email: 'member2@example.com',
    phone: '9876500005',
  },
];

export default function CommitteeMembersPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">Society Committee Members</CardTitle>
              <CardDescription>Meet the members managing our society.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      <CommitteeMembersDisplay members={mockCommitteeMembers} />
    </div>
  );
}
