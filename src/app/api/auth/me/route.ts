import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/server-utils';
import { getUserById } from '@/lib/server-utils';

export async function GET(req: NextRequest) {
  // Use the built-in cookies API for App Router
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload || typeof payload !== 'object' || !('userId' in payload) || !('societyId' in payload)) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }
  const user = await getUserById(payload.userId, payload.societyId);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  // Remove password before returning
  const { password, ...userProfile } = user;
  // Attach exp from JWT payload if present
  return NextResponse.json({ ...userProfile, exp: payload.exp });
}

export async function PUT(req: NextRequest) {
  // Auth: Accept Bearer token in Authorization header or session cookie
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload || typeof payload !== 'object' || !('userId' in payload) || !('societyId' in payload)) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }
  const user = await getUserById(payload.userId, payload.societyId);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  let update: any = {};
  let validationErrors: Record<string, string> = {};
  const body = await req.json();

  // Validate and collect fields
  if ('name' in body) {
    if (typeof body.name !== 'string' || !body.name.trim()) validationErrors.name = 'Name is required.';
    else update.name = body.name.trim();
  }
  if ('email' in body) {
    if (typeof body.email !== 'string' || !body.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) validationErrors.email = 'Invalid email.';
    else update.email = body.email.trim();
    // TODO: Trigger email verification if changed
  }
  if ('phone' in body) {
    if (typeof body.phone !== 'string' || !body.phone.match(/^\d{10}$/)) validationErrors.phone = 'Phone must be 10 digits.';
    else update.phone = body.phone;
  }
  if ('birthdate' in body) {
    if (typeof body.birthdate !== 'string' || isNaN(Date.parse(body.birthdate))) validationErrors.birthdate = 'Invalid birthdate.';
    else update.birthdate = body.birthdate;
  }
  if ('gender' in body) {
    if (typeof body.gender !== 'string' || !body.gender.trim()) validationErrors.gender = 'Gender is required.';
    else update.gender = body.gender.trim();
  }
  if ('aboutMe' in body) {
    if (typeof body.aboutMe !== 'string' || body.aboutMe.length > 500) validationErrors.aboutMe = 'About Me must be 500 chars or less.';
    else update.aboutMe = body.aboutMe;
  }
  if ('profilePhoto' in body) {
    if (typeof body.profilePhoto !== 'string' || !body.profilePhoto.trim()) validationErrors.profilePhoto = 'Profile photo must be a string.';
    else update.profilePhoto = body.profilePhoto;
  }
  if ('privacySettings' in body) {
    if (typeof body.privacySettings !== 'object') validationErrors.privacySettings = 'Privacy settings must be an object.';
    else update.privacySettings = body.privacySettings;
  }

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json({ message: 'Validation error', errors: validationErrors }, { status: 400 });
  }

  // Only update if there are changes
  if (Object.keys(update).length === 0) {
    // No changes
    const { password, ...userProfile } = user;
    return NextResponse.json(userProfile);
  }

  // Patch user in Cosmos DB
  try {
    const usersContainer = await (await import('@/lib/cosmosdb')).getUsersContainer();
    await usersContainer.item(user.id, user.societyId).patch(
      Object.entries(update).map(([key, value]) => ({ op: 'add', path: `/${key}`, value }))
    );
    // Return updated user
    const updatedUser = await getUserById(user.id, user.societyId);
    const { password, ...userProfile } = updatedUser;
    return NextResponse.json(userProfile);
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
