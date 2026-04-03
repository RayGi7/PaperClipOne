import { NextRequest, NextResponse } from 'next/server';
import { insertBooking, listBookings } from '@/lib/db';
import { createCalendarEvent } from '@/lib/calendar';
import { sendBookingEmails } from '@/lib/email';

const VALID_EVENT_TYPES = ['wedding', 'party', 'corporate', 'other'] as const;

// ── GET /api/bookings ── admin listing ────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookings = listBookings();
  return NextResponse.json({ bookings });
}

// ── POST /api/bookings ── create booking ──────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const errors = validate(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  const booking = insertBooking({
    name:       String(body.name).trim(),
    email:      String(body.email).trim().toLowerCase(),
    phone:      String(body.phone).trim(),
    event_date: String(body.event_date),
    event_time: String(body.event_time),
    event_type: String(body.event_type),
    notes:      body.notes && typeof body.notes === 'string' ? body.notes.trim() : null,
  });

  // Side-effects: calendar + email — best-effort, do not block the response
  await Promise.allSettled([
    createCalendarEvent(booking),
    sendBookingEmails(booking),
  ]);

  return NextResponse.json({ ok: true, booking }, { status: 201 });
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(body: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required');
  }
  if (
    !body.email ||
    typeof body.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    errors.push('a valid email is required');
  }
  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim() === '') {
    errors.push('phone is required');
  }
  if (
    !body.event_date ||
    typeof body.event_date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.event_date)
  ) {
    errors.push('event_date is required (YYYY-MM-DD)');
  }
  if (
    !body.event_time ||
    typeof body.event_time !== 'string' ||
    !/^\d{2}:\d{2}$/.test(body.event_time)
  ) {
    errors.push('event_time is required (HH:MM)');
  }
  if (
    !body.event_type ||
    typeof body.event_type !== 'string' ||
    !(VALID_EVENT_TYPES as readonly string[]).includes(body.event_type)
  ) {
    errors.push(`event_type must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
  }

  return errors;
}
