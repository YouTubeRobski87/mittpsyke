import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import {
  validateEmail,
  validateString,
  escapeHtml,
  safeMarkdownToHtml,
  LIMITS
} from '$lib/validation';
import { checkRateLimit, getClientIdentifier } from '$lib/validation/ratelimit';

// CORS headers for Capacitor native app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Handle CORS preflight
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    // 1. Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(`email:${clientId}`);

    if (!rateLimitResult.success) {
      return json(
        {
          success: false,
          error: 'Du har skickat för många e-postmeddelanden. Försök igen senare.'
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
          }
        }
      );
    }

    if (!env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return json(
        { success: false, error: 'E-postfunktionen är inte konfigurerad.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const resend = new Resend(env.RESEND_API_KEY);
    const { email, entry, date, weekday } = await request.json();

    if (!email || !entry) {
      return json(
        { success: false, error: 'E-postadress och innehåll krävs.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      return json(
        { success: false, error: emailError.message },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate entry length
    const entryError = validateString(entry, 'entry', LIMITS.GENERATED_ENTRY);
    if (entryError) {
      return json(
        { success: false, error: 'Dagboksinlägget är för långt.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert markdown to HTML (AI-generated content, no user HTML expected)
    const formattedEntry = safeMarkdownToHtml(entry);

    // Escape date/weekday for safe HTML insertion
    const safeWeekday = escapeHtml(weekday || 'Dagbok');
    const safeDate = escapeHtml(date || '');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">${safeWeekday}</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">${safeDate}</p>
      </div>

      <div style="font-size: 16px; color: #1a1a1a; line-height: 1.6;">
        <style>
          .entry p { margin: 0 0 1em 0; }
          .entry h1, .entry h2, .entry h3 { margin: 1.5em 0 0.5em 0; font-weight: 600; }
          .entry h1 { font-size: 1.5em; }
          .entry h2 { font-size: 1.3em; }
          .entry h3 { font-size: 1.1em; }
          .entry ul, .entry ol { margin: 0 0 1em 0; padding-left: 1.5em; }
          .entry li { margin: 0.25em 0; }
          .entry blockquote { margin: 1em 0; padding-left: 1em; border-left: 3px solid #ddd; color: #666; }
          .entry hr { border: none; border-top: 1px solid #eee; margin: 1.5em 0; }
          .entry a { color: #2563eb; }
        </style>
        <div class="entry">
          ${formattedEntry}
        </div>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 24px;">
        <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">
          Berättat av Storify
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: 'Storify <din@dagbok.mystorify.se>',
      replyTo: 'responses@mystorify.se',
      to: email,
      subject: `Din dagbok: ${weekday}${date ? `, ${date}` : ''}`,
      html: htmlContent
    });

    if (error) {
      console.error('Resend error:', error);
      return json(
        { success: false, error: 'Kunde inte skicka e-post. Försök igen.' },
        { status: 500, headers: corsHeaders }
      );
    }

    return json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('Email error:', err);
    return json(
      { success: false, error: 'Något gick fel. Försök igen.' },
      { status: 500, headers: corsHeaders }
    );
  }
};
