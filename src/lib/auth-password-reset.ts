import { getUsersContainer } from './cosmosdb';
import type { User } from './types';

export async function getUserByEmail(email: string): Promise<User | null> {
  const container = getUsersContainer();
  const query = {
    query: 'SELECT * FROM c WHERE c.email = @email',
    parameters: [{ name: '@email', value: email }],
  };
  const { resources } = await container.items.query<User>(query).fetchAll();
  return resources.length > 0 ? resources[0] : null;
}

export async function savePasswordResetToken(userId: string, token: string, expires: number): Promise<void> {
  const container = getUsersContainer();
  await container.item(userId, userId).patch([
    { op: 'add', path: '/passwordResetToken', value: token },
    { op: 'add', path: '/passwordResetTokenExpiry', value: expires },
  ]);
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  console.log(`Password reset link for ${email}: ${resetLink}`);
}

export async function getUserByResetToken(token: string): Promise<User | null> {
  const container = getUsersContainer();
  const now = Date.now();
  const query = {
    query: 'SELECT * FROM c WHERE c.passwordResetToken = @token AND c.passwordResetTokenExpiry > @now',
    parameters: [
      { name: '@token', value: token },
      { name: '@now', value: now },
    ],
  };
  const { resources } = await container.items.query<User>(query).fetchAll();
  return resources.length > 0 ? resources[0] : null;
}

export async function clearPasswordResetToken(userId: string): Promise<void> {
  const container = getUsersContainer();
  await container.item(userId, userId).patch([
    { op: 'remove', path: '/passwordResetToken' },
    { op: 'remove', path: '/passwordResetTokenExpiry' },
  ]);
}

export async function updateUserPassword(userId: string, hash: string): Promise<void> {
  const container = getUsersContainer();
  await container.item(userId, userId).patch([
    { op: 'replace', path: '/password', value: hash },
  ]);
}
