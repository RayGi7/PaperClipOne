import { google } from 'googleapis';
import type { Booking } from './db';

/** Creates a Google Calendar event for a confirmed booking.
 *  Requires GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID env vars.
 *  Logs a warning and returns silently if any are missing (e.g. in dev/test).
 */
export async function createCalendarEvent(booking: Booking): Promise<void> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!email || !key || !calendarId) {
    console.warn('[calendar] Env vars not set — skipping calendar event creation');
    return;
  }

  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  const startDateTime = `${booking.event_date}T${booking.event_time}:00`;
  // Default event duration: 4 hours
  const [hours, minutes] = booking.event_time.split(':').map(Number);
  const endHour = String((hours + 4) % 24).padStart(2, '0');
  const endDateTime = `${booking.event_date}T${endHour}:${String(minutes).padStart(2, '0')}:00`;

  try {
    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `DJ Booking — ${booking.name} (${booking.event_type})`,
        description: [
          `Name: ${booking.name}`,
          `Email: ${booking.email}`,
          `Phone: ${booking.phone}`,
          `Notes: ${booking.notes ?? 'None'}`,
        ].join('\n'),
        start: { dateTime: startDateTime, timeZone: 'UTC' },
        end: { dateTime: endDateTime, timeZone: 'UTC' },
      },
    });
  } catch (err) {
    console.error('[calendar] Failed to create calendar event:', err);
  }
}
