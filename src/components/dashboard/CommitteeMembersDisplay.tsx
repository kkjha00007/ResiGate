
// src/components/dashboard/CommitteeMembersDisplay.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Home, Mail, PhoneIcon } from 'lucide-react';

interface CommitteeMember {
  id: string;
  name: string;
  roleInCommittee: string;
  flatNumber: string;
  imageUrl: string;
  email?: string;
  phone?: string;
}

interface CommitteeMembersDisplayProps {
  members: CommitteeMember[];
}

export function CommitteeMembersDisplay({ members }: CommitteeMembersDisplayProps) {
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-10">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Committee member information is not available at this time.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {members.map((member) => (
        <Card key={member.id} className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
          <CardHeader className="items-center text-center p-4">
            <div className="relative h-32 w-32 mb-3">
              <Image
                src={member.imageUrl}
                alt={member.name}
                layout="fill"
                objectFit="cover"
                className="rounded-full"
                data-ai-hint="member photo"
              />
            </div>
            <CardTitle className="text-lg font-semibold text-primary">{member.name}</CardTitle>
            <Badge variant="secondary" className="mt-1">{member.roleInCommittee}</Badge>
          </CardHeader>
          <CardContent className="flex-grow space-y-2 text-sm p-4 pt-0">
            <div className="flex items-center text-muted-foreground">
              <Home className="h-4 w-4 mr-2 text-primary/80" />
              <span>Flat: {member.flatNumber}</span>
            </div>
            {member.email && (
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-4 w-4 mr-2 text-primary/80" />
                <a href={`mailto:${member.email}`} className="hover:underline hover:text-primary truncate">
                  {member.email}
                </a>
              </div>
            )}
            {member.phone && (
               <div className="flex items-center text-muted-foreground">
                <PhoneIcon className="h-4 w-4 mr-2 text-primary/80" />
                <a href={`tel:${member.phone}`} className="hover:underline hover:text-primary">
                  {member.phone}
                </a>
              </div>
            )}
          </CardContent>
          {/* <CardFooter className="text-xs text-muted-foreground p-4 pt-2 border-t">
            Contact for society matters.
          </CardFooter> */}
        </Card>
      ))}
    </div>
  );
}
