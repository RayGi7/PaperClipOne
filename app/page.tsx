'use client';

import { useState, FormEvent } from 'react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  eventDate?: string;
  eventType?: string;
}

const EVENT_TYPES = [
  { value: '', label: 'Select event type…' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'party', label: 'Party' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM: FormData = {
  name: '',
  email: '',
  phone: '',
  eventDate: '',
  eventType: '',
  notes: '',
};

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) errors.name = 'Name is required.';

  if (!data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!/^[\d\s\-+().]{7,20}$/.test(data.phone)) {
    errors.phone = 'Enter a valid phone number.';
  }

  if (!data.eventDate) {
    errors.eventDate = 'Event date and time are required.';
  } else {
    const selected = new Date(data.eventDate);
    if (selected <= new Date()) errors.eventDate = 'Event must be in the future.';
  }

  if (!data.eventType) errors.eventType = 'Please select an event type.';

  return errors;
}

export default function HomePage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            event_date: form.eventDate.slice(0, 10),
            event_time: form.eventDate.slice(11, 16),
            event_type: form.eventType,
            notes: form.notes,
          }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Server error (${res.status})`);
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="container">
        <div className="hero">
          <div className="hero-badge">Booking Confirmed</div>
        </div>
        <div className="card">
          <div className="success-box">
            <span className="success-icon">🎉</span>
            <h2>You&apos;re on the list!</h2>
            <p>
              Your booking request has been received. You&apos;ll get a confirmation
              email shortly with all the details.
            </p>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setForm(EMPTY_FORM);
                setErrors({});
                setSubmitError(null);
                setSubmitted(false);
              }}
            >
              Book another event
            </button>
          </div>
        </div>
        <footer>
          <p>Powered by DJ Booking — making memories one beat at a time.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <div className="hero-badge">Now Booking</div>
        <h1>Book the DJ</h1>
        <p>Fill out the form below and we&apos;ll get back to you within 24 hours.</p>
      </div>

      <div className="card">
        {submitError && (
          <div className="alert alert-error" role="alert">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">
                Full Name <span className="req">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                aria-describedby={errors.name ? 'name-err' : undefined}
              />
              {errors.name && (
                <span id="name-err" className="field-error" role="alert">
                  {errors.name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email <span className="req">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                aria-describedby={errors.email ? 'email-err' : undefined}
              />
              {errors.email && (
                <span id="email-err" className="field-error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">
                Phone <span className="req">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 555 000 0000"
                value={form.phone}
                onChange={handleChange}
                className={errors.phone ? 'error' : ''}
                aria-describedby={errors.phone ? 'phone-err' : undefined}
              />
              {errors.phone && (
                <span id="phone-err" className="field-error" role="alert">
                  {errors.phone}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="eventType">
                Event Type <span className="req">*</span>
              </label>
              <select
                id="eventType"
                name="eventType"
                value={form.eventType}
                onChange={handleChange}
                className={errors.eventType ? 'error' : ''}
                aria-describedby={errors.eventType ? 'type-err' : undefined}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value} disabled={t.value === ''}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.eventType && (
                <span id="type-err" className="field-error" role="alert">
                  {errors.eventType}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="eventDate">
              Event Date &amp; Time <span className="req">*</span>
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="datetime-local"
              value={form.eventDate}
              onChange={handleChange}
              className={errors.eventDate ? 'error' : ''}
              aria-describedby={errors.eventDate ? 'date-err' : undefined}
            />
            {errors.eventDate && (
              <span id="date-err" className="field-error" role="alert">
                {errors.eventDate}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes / Special Requests</label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Tell us about your venue, music preferences, or any special requests…"
              value={form.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Sending…
              </>
            ) : (
              'Request Booking'
            )}
          </button>
        </form>
      </div>

      <footer>
        <p>Powered by DJ Booking — making memories one beat at a time.</p>
      </footer>
    </div>
  );
}
