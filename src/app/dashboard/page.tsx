
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, CalendarClock, Phone, Shield, Flame, Ambulance, UserCheck, Newspaper } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import React, { useEffect } from "react";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const { activeNotices, fetchActiveNotices, isLoading: authLoading } = useAuth();

  useEffect(() => {
    fetchActiveNotices();
  }, [fetchActiveNotices]);

  const displayedNotices = activeNotices.slice(0, 3); // Show top 3 notices

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
                  <Newspaper className="h-6 w-6" /> {/* Changed icon to Newspaper */}
                  Important Announcements
                </CardTitle>
                <CardDescription>Stay updated with the latest society news.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {authLoading && displayedNotices.length === 0 && (
              <div className="text-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading announcements...</p>
              </div>
            )}
            {!authLoading && displayedNotices.length === 0 && (
               <div className="p-4 bg-secondary/50 rounded-md border border-secondary text-center">
                <p className="text-sm text-muted-foreground">No active announcements at the moment.</p>
              </div>
            )}
            {displayedNotices.map(notice => (
              <div key={notice.id} className="p-4 bg-secondary/50 rounded-md border border-secondary">
                <h4 className="font-semibold text-foreground mb-1">{notice.title}</h4>
                <p className="text-xs text-muted-foreground mb-1.5">Posted by {notice.postedByName} on {format(parseISO(notice.createdAt), 'PP')}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {notice.content}
                </p>
              </div>
            ))}
            {activeNotices.length > 3 && (
                <Button variant="link" className="p-0 h-auto text-primary">View All Announcements</Button> 
                // TODO: Link to a full notices page for users later
            )}
             {activeNotices.length === 0 && !authLoading && null}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
             <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
                    <CalendarClock className="h-6 w-6" />
                    Upcoming Meetings
                    </CardTitle>
                    <CardDescription>Society meetings and events schedule.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-secondary/50 rounded-md border border-secondary">
              <h4 className="font-semibold text-foreground mb-1">Committee Meeting - 10th Dec, 7 PM</h4>
              <p className="text-sm text-muted-foreground">
                Agenda: Security review and budget planning. Venue: Community Hall.
              </p>
            </div>
             <div className="p-4 bg-secondary/50 rounded-md border border-secondary">
              <h4 className="font-semibold text-foreground mb-1">Festival Celebration Planning - 18th Dec, 6 PM</h4>
              <p className="text-sm text-muted-foreground">
                Volunteers meet to discuss upcoming festival arrangements.
              </p>
            </div>
            <Button variant="link" className="p-0 h-auto text-primary">View Full Calendar</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
                    <Phone className="h-6 w-6" />
                    Important Contacts
                    </CardTitle>
                    <CardDescription>Quick access to essential numbers.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-md">
                <span className="flex items-center gap-2 font-medium text-foreground"><UserCheck className="h-5 w-5 text-primary/80"/>Security Guard (Day)</span>
                <span className="text-muted-foreground">98765 43210</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-md">
                <span className="flex items-center gap-2 font-medium text-foreground"><UserCheck className="h-5 w-5 text-primary/80"/>Security Guard (Night)</span>
                <span className="text-muted-foreground">87654 32109</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-md">
                <span className="flex items-center gap-2 font-medium text-foreground"><Shield className="h-5 w-5 text-blue-500"/>Local Police</span>
                <span className="text-muted-foreground">100 / 011-2345678</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-md">
                <span className="flex items-center gap-2 font-medium text-foreground"><Flame className="h-5 w-5 text-red-500"/>Fire Brigade</span>
                <span className="text-muted-foreground">101</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-md">
                <span className="flex items-center gap-2 font-medium text-foreground"><Ambulance className="h-5 w-5 text-emerald-500"/>Ambulance</span>
                <span className="text-muted-foreground">102 / 108</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-md">
                <span className="flex items-center gap-2 font-medium text-foreground">Estate Manager</span>
                <span className="text-muted-foreground">76543 21098</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
