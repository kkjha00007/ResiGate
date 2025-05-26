
// This file is part of the reverted "Security Log" feature.
// Keeping it as an empty placeholder to avoid 404s if any old references exist,
// but it no longer contains active API logic.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Security incident reporting is currently disabled.' }, { status: 404 });
}
