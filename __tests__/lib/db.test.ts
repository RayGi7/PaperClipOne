import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mock better-sqlite3 before importing lib/db ───────────────────────────────
const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 1 });
const mockGet = jest.fn();
const mockAll = jest.fn().mockReturnValue([]);
const mockExec = jest.fn();
const mockPragma = jest.fn();
const mockPrepare = jest.fn().mockReturnValue({ run: mockRun, get: mockGet, all: mockAll });

const MockDatabase = jest.fn().mockImplementation(() => ({
  pragma: mockPragma,
  exec: mockExec,
  prepare: mockPrepare,
  close: jest.fn(),
}));

jest.mock('better-sqlite3', () => MockDatabase);

// Must import after mocking
import { getDb, insertBooking, listBookings, _resetDbForTesting } from '@/lib/db';

beforeEach(() => {
  _resetDbForTesting();
  jest.clearAllMocks();
  mockRun.mockReturnValue({ lastInsertRowid: 42 });
  mockGet.mockReturnValue({
    id: 42,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    event_date: '2025-08-15',
    event_time: '18:00',
    event_type: 'wedding',
    notes: 'outdoor',
    created_at: '2025-08-01T10:00:00',
  });
  mockAll.mockReturnValue([]);
  mockPrepare.mockReturnValue({ run: mockRun, get: mockGet, all: mockAll });
});

describe('getDb', () => {
  it('creates a Database instance', () => {
    const db = getDb();
    expect(db).toBeDefined();
    expect(MockDatabase).toHaveBeenCalledTimes(1);
  });

  it('calls pragma WAL and runs migration', () => {
    getDb();
    expect(mockPragma).toHaveBeenCalledWith('journal_mode = WAL');
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS bookings'));
  });

  it('returns the same instance on repeated calls', () => {
    expect(getDb()).toBe(getDb());
    expect(MockDatabase).toHaveBeenCalledTimes(1);
  });
});

describe('insertBooking', () => {
  const input = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    event_date: '2025-08-15',
    event_time: '18:00',
    event_type: 'wedding',
    notes: 'outdoor',
  };

  it('calls INSERT and SELECT, returns the booking', () => {
    const booking = insertBooking(input);
    expect(mockRun).toHaveBeenCalledWith(input);
    expect(mockGet).toHaveBeenCalledWith(42);
    expect(booking.id).toBe(42);
    expect(booking.name).toBe('Jane Doe');
  });

  it('uses an INSERT statement with all expected fields', () => {
    insertBooking(input);
    const insertCall = mockPrepare.mock.calls.find(
      (c) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO bookings'),
    );
    expect(insertCall).toBeDefined();
    expect(insertCall![0]).toContain('@name');
    expect(insertCall![0]).toContain('@email');
    expect(insertCall![0]).toContain('@event_type');
  });
});

describe('listBookings', () => {
  it('returns an empty array when no rows exist', () => {
    mockAll.mockReturnValueOnce([]);
    expect(listBookings()).toEqual([]);
  });

  it('returns rows from the SELECT query', () => {
    const rows = [
      { id: 1, name: 'Alice', email: 'a@b.com', phone: '555', event_date: '2025-09-01', event_time: '20:00', event_type: 'party', notes: null, created_at: '2025-01-01' },
    ];
    mockAll.mockReturnValueOnce(rows);
    expect(listBookings()).toEqual(rows);
  });

  it('queries with ORDER BY created_at DESC', () => {
    listBookings();
    const selectCall = mockPrepare.mock.calls.find(
      (c) => typeof c[0] === 'string' && (c[0] as string).includes('SELECT * FROM bookings'),
    );
    expect(selectCall).toBeDefined();
    expect(selectCall![0]).toContain('ORDER BY created_at DESC');
  });
});
