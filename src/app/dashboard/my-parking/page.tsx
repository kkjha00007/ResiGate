
// src/app/dashboard/my-parking/page.tsx
import { MyParkingSpotsDisplay } from '@/components/dashboard/parking/MyParkingSpotsDisplay';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ParkingCircle } from 'lucide-react';

export default function MyParkingPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ParkingCircle className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold text-primary">My Assigned Parking</CardTitle>
              <CardDescription>View details of your allocated parking spot(s).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MyParkingSpotsDisplay />
        </CardContent>
      </Card>
    </div>
  );
}
