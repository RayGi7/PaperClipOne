import nodemailer from 'nodemailer';
import type { Booking } from './db';

/** Sends a confirmation email to the customer and a notification email to the DJ.
 *  Requires EMAIL_FROM, EMAIL_APP_PASSWORD, DJ_EMAIL env vars.
 *  Logs a warning and returns silently if any are missing (e.g. in dev/test).
 */
export async function sendBookingEmails(booking: Booking): Promise<void> {
  const from = process.env.EMAIL_FROM;
  const pass = process.env.EMAIL_APP_PASSWORD;
  const djEmail = process.env.DJ_EMAIL;

  if (!from || !pass || !djEmail) {
    console.warn('[email] Env vars not set — skipping email notifications');
    return;
  }

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: from, pass },
  });

  const eventSummary = [
    `Date:       ${booking.event_date}`,
    `Time:       ${booking.event_time}`,
    `Event type: ${booking.event_type}`,
    `Notes:      ${booking.notes ?? 'None'}`,
  ].join('\n');

  try {
    // Confirmation to customer
    await transport.sendMail({
      from,
      to: booking.email,
      subject: 'Your DJ Booking Request — Received',
      text: [
        `Hi ${booking.name},`,
        '',
        "Thanks for reaching out! We've received your booking request and will be in touch shortly to confirm.",
        '',
        eventSummary,
        '',
        'Best,\nThe DJ Team',
      ].join('\n'),
      html: `
        <p>Hi <strong>${escHtml(booking.name)}</strong>,</p>
        <p>Thanks for reaching out! We've received your booking request and will be in touch shortly to confirm.</p>
        <pre style="font-family:monospace;background:#f4f4f4;padding:12px;border-radius:4px">${escHtml(eventSummary)}</pre>
        <p>Best,<br>The DJ Team</p>
      `,
    });

    // Notification to DJ
    await transport.sendMail({
      from,
      to: djEmail,
      subject: `New Booking Request — ${booking.name} (${booking.event_type})`,
      text: [
        'New booking request received!',
        '',
        `Name:  ${booking.name}`,
        `Email: ${booking.email}`,
        `Phone: ${booking.phone}`,
        '',
        eventSummary,
      ].join('\n'),
      html: `
        <h2>New Booking Request</h2>
        <p>
          <strong>Name:</strong>  ${escHtml(booking.name)}<br>
          <strong>Email:</strong> ${escHtml(booking.email)}<br>
          <strong>Phone:</strong> ${escHtml(booking.phone)}
        </p>
        <pre style="font-family:monospace;background:#f4f4f4;padding:12px;border-radius:4px">${escHtml(eventSummary)}</pre>
      `,
    });
  } catch (err) {
    console.error('[email] Failed to send booking emails:', err);
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
