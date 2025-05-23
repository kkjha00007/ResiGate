
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, CalendarClock, Phone, Shield, Flame, Ambulance, UserCheck } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
                  <Megaphone className="h-6 w-6" />
                  Important Announcements
                </CardTitle>
                <CardDescription>Stay updated with the latest society news.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-secondary/50 rounded-md border border-secondary">
              <h4 className="font-semibold text-foreground mb-1">Water Supply Disruption - 25th Dec</h4>
              <p className="text-sm text-muted-foreground">
                Please note there will be a temporary disruption in water supply on December 25th from 10 AM to 2 PM due to essential maintenance work.
              </p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-md border border-secondary">
              <h4 className="font-semibold text-foreground mb-1">Annual General Meeting (AGM) Notice</h4>
              <p className="text-sm text-muted-foreground">
                The AGM is scheduled for January 15th. Details will be shared soon.
              </p>
            </div>
             <Button variant="link" className="p-0 h-auto text-primary">View All Announcements</Button>
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
