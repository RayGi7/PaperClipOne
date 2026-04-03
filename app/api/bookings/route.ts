// Booking API — implemented by Backend Lead (RAY-5)
// POST /api/bookings  — create a booking
// GET  /api/bookings  — list bookings (admin)
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ bookings: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Backend Lead implements full handler (RAY-5)
  return NextResponse.json({ ok: true, received: body }, { status: 201 });
}
