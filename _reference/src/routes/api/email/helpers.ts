import { escapeHtml, safeMarkdownToHtml } from '$lib/validation';

export function buildEmailHtml(
	entry: string,
	weekday: string,
	date: string
): string {
	const formattedEntry = safeMarkdownToHtml(entry);
	const safeWeekday = escapeHtml(weekday || 'Dagbok');
	const safeDate = escapeHtml(date || '');

	return `
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
}

export function buildEmailSubject(weekday: string, date?: string): string {
	return `Din dagbok: ${weekday}${date ? `, ${date}` : ''}`;
}
