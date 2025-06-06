import { getNotificationsContainer } from './cosmosdb';
import type { Notification } from './types';
import { v4 as uuidv4 } from 'uuid';
import { sendNotificationEvent } from './notification-ws-client';

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'> & { read?: boolean }) {
  const container = getNotificationsContainer();
  const doc: Notification = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    read: notification.read ?? false,
    ...notification,
  };
  await container.items.create(doc);
  // Send real-time event
  try { sendNotificationEvent(doc); } catch (e) { /* ignore */ }
  return doc;
}

export async function getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const container = getNotificationsContainer();
  const query = {
    query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
    parameters: [{ name: '@userId', value: userId }],
  };
  const { resources } = await container.items.query<Notification>(query, { maxItemCount: limit }).fetchAll();
  return resources;
}

export async function markNotificationRead(notificationId: string) {
  const container = getNotificationsContainer();
  const { resource } = await container.item(notificationId, notificationId).read<Notification>();
  if (resource) {
    resource.read = true;
    await container.item(notificationId, notificationId).replace(resource);
    return resource;
  }
  return null;
}
