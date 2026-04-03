import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mock dependencies before importing the route ─────────────────────────────
const mockInsertBooking = jest.fn();
const mockListBookings = jest.fn();

jest.mock('@/lib/db', () => ({
  insertBooking: mockInsertBooking,
  listBookings: mockListBookings,
}));
jest.mock('@/lib/calendar', () => ({ createCalendarEvent: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/email', () => ({ sendBookingEmails: jest.fn().mockResolvedValue(undefined) }));

import { GET, POST } from '@/app/api/bookings/route';
import { NextRequest } from 'next/server';

process.env.ADMIN_API_KEY = 'test-admin-key';

const createdBooking = {
  id: 1,
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: '555-9876',
  event_date: '2025-09-20',
  event_time: '19:00',
  event_type: 'party',
  notes: 'rooftop',
  created_at: '2025-09-01T12:00:00',
};

const validBody = {
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: '555-9876',
  event_date: '2025-09-20',
  event_time: '19:00',
  event_type: 'party',
  notes: 'rooftop',
};

function req(method: string, body?: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/bookings', {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInsertBooking.mockReturnValue(createdBooking);
  mockListBookings.mockReturnValue([createdBooking]);
});

// ── GET ───────────────────────────────────────────────────────────────────────
describe('GET /api/bookings', () => {
  it('returns 401 without API key', async () => {
    const res = await GET(req('GET'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 401 for wrong API key', async () => {
    const res = await GET(req('GET', undefined, { 'x-api-key': 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('returns 200 with bookings for correct API key', async () => {
    const res = await GET(req('GET', undefined, { 'x-api-key': 'test-admin-key' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.bookings).toHaveLength(1);
    expect(json.bookings[0].name).toBe('Alice Smith');
  });

  it('returns empty array when no bookings exist', async () => {
    mockListBookings.mockReturnValueOnce([]);
    const res = await GET(req('GET', undefined, { 'x-api-key': 'test-admin-key' }));
    expect((await res.json()).bookings).toEqual([]);
  });
});

// ── POST ──────────────────────────────────────────────────────────────────────
describe('POST /api/bookings', () => {
  it('returns 201 with created booking for valid input', async () => {
    const res = await POST(req('POST', validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.booking.id).toBe(1);
    expect(json.booking.name).toBe('Alice Smith');
    expect(mockInsertBooking).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for invalid JSON', async () => {
    const badReq = new NextRequest('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json!!!',
    });
    const res = await POST(badReq);
    expect(res.status).toBe(400);
  });

  it('returns 400 with details when required fields are missing', async () => {
    const res = await POST(req('POST', {}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Validation failed');
    expect(json.details.length).toBeGreaterThan(0);
  });

  it('rejects invalid email', async () => {
    const res = await POST(req('POST', { ...validBody, email: 'not-an-email' }));
    expect(res.status).toBe(400);
    expect((await res.json()).details.some((d: string) => d.includes('email'))).toBe(true);
  });

  it('rejects wrong event_date format', async () => {
    const res = await POST(req('POST', { ...validBody, event_date: '20-09-2025' }));
    expect(res.status).toBe(400);
    expect((await res.json()).details.some((d: string) => d.includes('event_date'))).toBe(true);
  });

  it('rejects invalid event_type', async () => {
    const res = await POST(req('POST', { ...validBody, event_type: 'birthday' }));
    expect(res.status).toBe(400);
    expect((await res.json()).details.some((d: string) => d.includes('event_type'))).toBe(true);
  });

  it('accepts all valid event_type values', async () => {
    for (const event_type of ['wedding', 'party', 'corporate', 'other']) {
      const res = await POST(req('POST', { ...validBody, event_type }));
      expect(res.status).toBe(201);
    }
  });

  it('allows notes to be omitted', async () => {
    const { notes: _n, ...withoutNotes } = validBody;
    const res = await POST(req('POST', withoutNotes));
    expect(res.status).toBe(201);
    const call = mockInsertBooking.mock.calls[0][0] as { notes: unknown };
    expect(call.notes).toBeNull();
  });

  it('trims whitespace and lowercases email', async () => {
    await POST(req('POST', { ...validBody, name: '  Bob  ', email: 'BOB@EXAMPLE.COM', phone: ' 555 ' }));
    const call = mockInsertBooking.mock.calls[0][0] as { name: string; email: string; phone: string };
    expect(call.name).toBe('Bob');
    expect(call.email).toBe('bob@example.com');
    expect(call.phone).toBe('555');
  });
});
