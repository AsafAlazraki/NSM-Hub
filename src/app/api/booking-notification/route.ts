import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_TO = process.env.BOOKING_NOTIFICATION_TO || 'service@nsmaine.com.au';
// The from address must belong to a domain verified in the Resend account.
const NOTIFICATION_FROM = process.env.BOOKING_NOTIFICATION_FROM || 'NSM Hub Bookings <onboarding@resend.dev>';

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const row = (label: string, value?: string | null) => {
    if (!value) return '';
    return `<tr>
        <td style="padding:6px 12px;color:#64748b;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:6px 12px;color:#0f172a;white-space:pre-wrap;">${escapeHtml(value)}</td>
    </tr>`;
};

const section = (title: string, rows: string) => {
    if (!rows) return '';
    return `<h3 style="margin:20px 0 4px;font-size:14px;color:#334155;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(title)}</h3>
    <table style="border-collapse:collapse;width:100%;background:#f8fafc;border-radius:8px;">${rows}</table>`;
};

export async function POST(request: NextRequest) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('booking-notification: RESEND_API_KEY is not configured; skipping email.');
        return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY not configured' }, { status: 503 });
    }

    let application: Record<string, string | null | undefined>;
    try {
        application = await request.json();
    } catch {
        return NextResponse.json({ sent: false, reason: 'Invalid JSON body' }, { status: 400 });
    }

    if (!application.customerName || !application.customerEmail) {
        return NextResponse.json({ sent: false, reason: 'Missing customer details' }, { status: 400 });
    }

    const applicationUrl = application.id && application.origin
        ? `${application.origin}/booking-application/${application.id}`
        : null;

    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <h2 style="margin:0 0 4px;">New Booking Application</h2>
        <p style="margin:0 0 16px;color:#64748b;">A customer has submitted a booking application via the online form.</p>
        ${section('Customer', [
            row('Name', application.customerName),
            row('Mobile', application.customerMobileNumber),
            row('Email', application.customerEmail),
            row('Address', application.customerAddress),
        ].join(''))}
        ${section('Boat', [
            row('Make', application.boatMake),
            row('Model', application.boatModel),
            row('HIN', application.boatHin),
            row('Registration', application.boatRegistrationNumber),
        ].join(''))}
        ${section('Engine', [
            row('Make', application.engineMake),
            row('Model', application.engineModel),
            row('Serial Number', application.engineSerialNumber),
        ].join(''))}
        ${section('Trailer', [
            row('Make', application.trailerMake),
            row('Model', application.trailerModel),
            row('VIN', application.trailerVin),
            row('Registration', application.trailerRegistration),
        ].join(''))}
        ${section('Work to be Performed', row('Details', application.workToBePerformed))}
        ${section('Dates', [
            row('Booking Date Requested', application.bookingDateRequested),
            row('Required for Collection', application.dateRequiredForCollection),
        ].join(''))}
        ${applicationUrl ? `<p style="margin:24px 0;"><a href="${escapeHtml(applicationUrl)}" style="background:#78A0D6;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;">View in NSM Hub</a></p>` : ''}
    </div>`;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: NOTIFICATION_FROM,
                to: [NOTIFICATION_TO],
                reply_to: application.customerEmail,
                subject: `New Booking Application — ${application.customerName}`,
                html,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('booking-notification: Resend rejected the email:', response.status, errorBody);
            return NextResponse.json({ sent: false, reason: `Resend error ${response.status}` }, { status: 502 });
        }

        return NextResponse.json({ sent: true });
    } catch (error) {
        console.error('booking-notification: failed to send email:', error);
        return NextResponse.json({ sent: false, reason: 'Request to Resend failed' }, { status: 502 });
    }
}
