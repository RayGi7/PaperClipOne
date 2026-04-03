'use client';

import { useState, useEffect, useCallback } from 'react';

interface Booking {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: string;
  notes?: string;
  createdAt?: string;
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminBookingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${key}` },
      });

      if (res.status === 401 || res.status === 403) {
        setError('Invalid API key. Access denied.');
        setApiKey('');
        return;
      }

      if (!res.ok) {
        throw new Error(`Server error (${res.status})`);
      }

      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchBookings(apiKey);
    }
  }, [apiKey, fetchBookings]);

  if (!apiKey) {
    return (
      <div className="auth-gate">
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>🔒</span>
        <h2>Admin Access</h2>
        <p>Enter your admin API key to view bookings.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputKey.trim()) {
              setError(null);
              setApiKey(inputKey.trim());
            }
          }}
        >
          <div className="form-group">
            <label htmlFor="apikey">API Key</label>
            <input
              id="apikey"
              type="password"
              placeholder="Enter admin API key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!inputKey.trim()}
            style={{ marginTop: '0.25rem' }}
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1>Bookings</h1>
          {!loading && <span className="badge">{bookings.length} total</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-ghost"
            onClick={() => fetchBookings(apiKey)}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setApiKey('');
              setInputKey('');
              setBookings([]);
              setError(null);
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 1rem' }} />
          <p>Loading bookings…</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📭</span>
          <p>No bookings yet.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Event</th>
                <th>Event Date</th>
                <th>Submitted</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b.id ?? i}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td>{b.name}</td>
                  <td>
                    <div>{b.phone}</div>
                    <div className="td-email">{b.email}</div>
                  </td>
                  <td>
                    <span className="td-type">{b.eventType}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(b.eventDate)}</td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {formatDate(b.createdAt)}
                  </td>
                  <td style={{ maxWidth: 220, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {b.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer>
        <p>DJ Booking Admin — internal use only.</p>
      </footer>
    </div>
  );
}
