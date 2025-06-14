// src/lib/rotation-history.ts
// Data model for parking rotation history

export interface ParkingRotationHistory {
  id: string; // UUID
  societyId: string;
  date: string; // ISO date string
  deallocatedUserIds: string[];
  allocatedUserIds: string[];
  details: Array<{
    spotId: string;
    fromUserId?: string;
    toUserId?: string;
    freezeUntil?: string;
  }>;
}
