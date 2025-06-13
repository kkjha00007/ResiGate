import { getNotificationsContainer } from './cosmosdb';
import type { Notification } from './types';
import { v4 as uuidv4 } from 'uuid';
import { sendNotificationEvent } from './notification-ws-client';
import { getUsersContainer } from './cosmosdb';
import type { User } from './types';

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

/**
 * Send a notification to all admins in a society.
 * Used for SOS and other admin alerts.
 */
export async function sendNotificationToAdmins({ societyId, type, title, message, link }: {
  societyId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  // Find all admins in the society
  const usersContainer = getUsersContainer();
  const { resources: admins } = await usersContainer.items.query<User>({
    query: 'SELECT * FROM c WHERE c.societyId = @societyId AND (c.role = "societyAdmin" OR c.role = "superadmin")',
    parameters: [{ name: '@societyId', value: societyId }],
  }).fetchAll();
  // Send notification to each admin
  await Promise.all((admins as User[]).map((admin: User) =>
    createNotification({
      userId: admin.id,
      type,
      title,
      message,
      link,
    })
  ));
}
