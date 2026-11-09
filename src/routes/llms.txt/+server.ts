import { canonical } from '$lib/seo';
import { positioningCopy } from '$lib/positioning-copy';

// /llms.txt: en kort textfil som AI-tjänster kan läsa för att förstå vad
// MittPsyke är. Samma ord som "I korthet"-rutorna, så att beskrivningen aldrig
// skiljer sig mellan sajten och filen.
const LINKS: ReadonlyArray<readonly [string, string, string]> = [
	['Om MittPsyke', '/om-mittpsyke', 'Varför MittPsyke finns och vem som står bakom'],
	['Så fungerar MittPsyke', '/sa-fungerar-mittpsyke', 'Dagboken, Framsteg och den valfria AI-chatten'],
	['Digital dagbok för mående', '/digital-dagbok-for-maende', 'Skriv direkt, med eller utan konto'],
	['Anonym dagbok online', '/anonym-dagbok-online', 'Skriv utan konto i webbläsaren'],
	['Dagboksskrivande', '/journalforing', 'Om att skriva dagbok för reflektion'],
	['Ansvarsfull AI', '/ansvarsfull-ai', 'Hur AI-chatten används och var gränserna går'],
	['Integritet', '/integritet', 'Vilka uppgifter som sparas och var']
];

export function GET() {
	const body = `# MittPsyke

> ${positioningCopy.core}

${positioningCopy.boundary}

## Sidor

${LINKS.map(([title, path, note]) => `- [${title}](${canonical(path)}): ${note}`).join('\n')}
`;

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8'
		}
	});
}
