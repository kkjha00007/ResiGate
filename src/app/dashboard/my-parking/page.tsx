// src/app/dashboard/my-parking/page.tsx
import { MyParkingSpotsDisplay } from '@/components/dashboard/parking/MyParkingSpotsDisplay';
import { MyVehiclesForm } from '@/components/dashboard/parking/MyVehiclesForm';
import { ParkingRequestForm } from '@/components/dashboard/parking/ParkingRequestForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ParkingCircle } from 'lucide-react';

export default function MyParkingPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Add/Track Your Vehicle</CardTitle>
            <CardDescription>Add your car or bike to your profile for tracking and analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <MyVehiclesForm />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Request Parking Allocation</CardTitle>
            <CardDescription>Request a parking spot for your registered vehicle(s).</CardDescription>
          </CardHeader>
          <CardContent>
            <ParkingRequestForm />
          </CardContent>
        </Card>
      </div>
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
