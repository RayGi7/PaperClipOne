import Database from 'better-sqlite3';
import path from 'path';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'bookings.db');
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    migrate(_db);
  }
  return _db;
}

/** Reset the singleton — for use in tests only. */
export function _resetDbForTesting(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL,
      phone       TEXT    NOT NULL,
      event_date  TEXT    NOT NULL,
      event_time  TEXT    NOT NULL,
      event_type  TEXT    NOT NULL,
      notes       TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string;
  event_date: string;
  event_time: string;
  event_type: string;
  notes: string | null;
  created_at: string;
}

export type BookingInput = Omit<Booking, 'id' | 'created_at'>;

export function insertBooking(data: BookingInput): Booking {
  const db = getDb();
  const stmt = db.prepare<BookingInput>(`
    INSERT INTO bookings (name, email, phone, event_date, event_time, event_type, notes)
    VALUES (@name, @email, @phone, @event_date, @event_time, @event_type, @notes)
  `);
  const result = stmt.run(data);
  return db
    .prepare<[number | bigint], Booking>('SELECT * FROM bookings WHERE id = ?')
    .get(result.lastInsertRowid) as Booking;
}

export function listBookings(): Booking[] {
  return getDb()
    .prepare<[], Booking>('SELECT * FROM bookings ORDER BY created_at DESC')
    .all() as Booking[];
}
