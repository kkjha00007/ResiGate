import { v4 as uuidv4 } from 'uuid';
import { getUsersContainer } from './cosmosdb';

export interface RefreshTokenRecord {
  id: string; // the refresh token itself
  userId: string;
  deviceId?: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
}

export async function createRefreshToken(userId: string, deviceId?: string, expiresInDays = 90): Promise<RefreshTokenRecord> {
  const id = uuidv4() + uuidv4(); // long, random
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const record: RefreshTokenRecord = {
    id,
    userId,
    deviceId,
    createdAt: now.toISOString(),
    expiresAt,
    revoked: false,
  };
  const usersContainer = await getUsersContainer();
  await usersContainer.items.create(record);
  return record;
}

export async function getRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
  const usersContainer = await getUsersContainer();
  try {
    const { resource } = await usersContainer.item(token, token).read();
    return resource as RefreshTokenRecord;
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(token: string) {
  const usersContainer = await getUsersContainer();
  try {
    await usersContainer.item(token, token).patch([
      { op: 'add', path: '/revoked', value: true }
    ]);
  } catch {}
}
