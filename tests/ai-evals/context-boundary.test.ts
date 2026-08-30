import { describe, expect, it } from 'vitest';
import { _buildSupportChatRequest } from '../../src/routes/api/chat/+server';
import { buildCheckinReflectionRequest } from '../../src/lib/server/ai/checkin-reflection';
import { buildDiaryReflectionRequest } from '../../src/lib/server/ai/diary-reflection';
import { formatMemoriesForPrompt, type UserMemory } from '../../src/lib/server/user-memory';
import { buildWeeklySummaryRequest } from '../../src/lib/server/ai/weekly-summary';
import { buildWeeklySummarySafetyInstructions } from '../../src/lib/server/ai/safety-instructions';
import type { AITextRequest } from '../../src/lib/server/ai/text-generation';

/* MINIMUM NECESSARY CONTEXT
 *
 * Den befintliga sviten bevisar att nödvändig kontext FINNS. De här testerna
 * bevisar motsatsen: att onödig kontext UTEBLIR. Utan det kan ett minnesblock
 * eller ett dagboksutdrag börja följa med i varje request utan att något går
 * sönder eller något test blir rött.
 *
 * Allt går genom produktens egna builders. Ingen prompt kopieras hit, inget
 * test-only requestformat byggs.
 */

/** Semantiska markörer, inte hela meningar - de ska tåla normal copyändring. */
const MEMORY_MARKERS = ['Bakgrund för kontinuitet', 'tidigare samtal med samma användare'];
const DIARY_MARKERS = ['Dagboksinlägg', 'dagboksanteckningar', 'Aktuella mål'];
const PROFILE_MARKERS = ['user_metadata', 'ai_diary_context_enabled', 'E-post', 'user_id'];

/** Allt som faktiskt når providern: instruktioner plus meddelanden. */
function requestText(request: AITextRequest): string {
	return [
		...(request.systemInstructions ?? []),
		...request.messages.map((message) => message.content)
	].join('\n');
}

function expectAbsent(request: AITextRequest, markers: string[], label: string) {
	const text = requestText(request);
	for (const marker of markers) {
		expect(text.includes(marker), `${label}: requesten innehåller "${marker}"`).toBe(false);
	}
}

const memories: UserMemory[] = [
	{ id: 'm1', content: 'Tänker ofta på jobbet om kvällarna.', created_at: '2026-01-01T00:00:00.000Z' }
];

function supportChat(contextBlocks: string[]) {
	return _buildSupportChatRequest({
		category: 'G',
		history: [],
		message: 'Jag har svårt att somna.',
		contextBlocks
	});
}

describe('supportive_conversation: kontexten är villkorlig', () => {
	it('utan minne skickas inget minnesblock', () => {
		// Produktkoden anropar formatMemoriesForPrompt(memories); tom lista ska ge
		// tom sträng, som i sin tur filtreras bort i builder-steget.
		expect(formatMemoriesForPrompt([])).toBe('');
		expectAbsent(supportChat([formatMemoriesForPrompt([]), '']), MEMORY_MARKERS, 'support-chat utan minne');
	});

	it('med minne skickas minnesblocket', () => {
		const text = requestText(supportChat([formatMemoriesForPrompt(memories), '']));

		for (const marker of MEMORY_MARKERS) expect(text).toContain(marker);
		expect(text).toContain('Tänker ofta på jobbet om kvällarna.');
	});

	it('utan dagbokskontext skickas inget dagboksblock', () => {
		// Produktkoden sätter diaryContextBlock till '' när användaren inte både
		// slagit på inställningen och lämnat hälsosamtycke.
		expectAbsent(supportChat(['', '']), DIARY_MARKERS, 'support-chat utan dagbokskontext');
	});

	it('med dagbokskontext skickas dagboksblocket', () => {
		const diaryBlock = 'Senaste dagboksanteckningar:\n- Sov dåligt inatt.';
		expect(requestText(supportChat(['', diaryBlock]))).toContain('dagboksanteckningar');
	});

	it('skickar aldrig profil- eller kontometadata', () => {
		expectAbsent(supportChat([formatMemoriesForPrompt(memories), '']), PROFILE_MARKERS, 'support-chat');
	});

	it('skickar bara den historik anroparen faktiskt ger', () => {
		const request = _buildSupportChatRequest({
			category: 'G',
			history: [{ role: 'user', content: 'Tidigare fråga.' }],
			message: 'Ny fråga.',
			contextBlocks: []
		});

		expect(request.messages.map((message) => message.content)).toEqual([
			'Tidigare fråga.',
			'Ny fråga.'
		]);
	});
});

describe('diary_reflection: bara den aktuella texten', () => {
	const request = buildDiaryReflectionRequest('Jag kände mig rastlös hela dagen.');

	it('innehåller dagbokstexten', () => {
		expect(requestText(request)).toContain('Jag kände mig rastlös hela dagen.');
	});

	it('innehåller varken minne, chatthistorik eller profil', () => {
		expectAbsent(request, MEMORY_MARKERS, 'diary-reflection');
		expectAbsent(request, PROFILE_MARKERS, 'diary-reflection');
	});

	it('skickar exakt ett meddelande', () => {
		// Ingen historik kan smyga in: byggaren tar bara en sträng.
		expect(request.messages).toHaveLength(1);
		expect(request.messages[0].role).toBe('user');
	});
});

describe('checkin_reflection: bara den aktuella incheckningen', () => {
	const request = buildCheckinReflectionRequest('Tema: oro i kroppen. Parkering: låta det vänta.');

	it('innehåller incheckningens sammanfattning', () => {
		expect(requestText(request)).toContain('oro i kroppen');
	});

	it('innehåller varken minne, dagbokshistorik eller profil', () => {
		expectAbsent(request, MEMORY_MARKERS, 'checkin-reflection');
		expectAbsent(request, PROFILE_MARKERS, 'checkin-reflection');
	});

	it('skickar exakt ett meddelande', () => {
		expect(request.messages).toHaveLength(1);
	});
});

describe('weekly_summary: bara den period routen hämtade', () => {
	const entries = [
		{ date: '2026-08-24', mood: 4, content: 'Trött hela dagen.' },
		{ date: '2026-08-25', mood: 6, content: 'Bättre efter en promenad.' },
		{ date: '2026-08-26', mood: 5, content: 'Ojämnt, men okej.' }
	];
	const request = buildWeeklySummaryRequest(entries, 35, 2026);

	it('använder rätt purpose', () => {
		expect(request.purpose).toBe('weekly-summary');
	});

	it('använder produktens egna safety-instruktioner', () => {
		// Jämförs mot funktionen, inte mot en kopierad textmassa.
		expect(request.systemInstructions).toEqual(buildWeeklySummarySafetyInstructions());
	});

	it('innehåller de inlägg den fick, i den ordning den fick dem', () => {
		const text = requestText(request);

		for (const entry of entries) {
			expect(text).toContain(entry.content);
			expect(text).toContain(entry.date);
		}
		const positions = entries.map((entry) => text.indexOf(entry.date));
		expect(positions).toEqual([...positions].sort((a, b) => a - b));
	});

	it('innehåller vecka och år enligt nuvarande kontrakt', () => {
		const text = requestText(request);

		expect(text).toContain('vecka 35');
		expect(text).toContain('år 2026');
	});

	it('innehåller ingenting utöver de inlägg som skickades in', () => {
		const text = requestText(buildWeeklySummaryRequest([entries[0]], 35, 2026));

		// Ett inlägg som aldrig lämnades till buildern kan inte dyka upp.
		expect(text).toContain('Trött hela dagen.');
		expect(text).not.toContain('Bättre efter en promenad.');
	});

	it('innehåller varken minne, chatthistorik eller profilmetadata', () => {
		expectAbsent(request, MEMORY_MARKERS, 'weekly-summary');
		expectAbsent(request, PROFILE_MARKERS, 'weekly-summary');
	});

	it('skickar exakt ett meddelande', () => {
		expect(request.messages).toHaveLength(1);
		expect(request.messages[0].role).toBe('user');
	});

	it('filtrerar inte på datum - det ägs av routens fråga', () => {
		// Buildern ska inte bli ett andra policylager: den formaterar det den får.
		const outsideWeek = [{ date: '2020-01-01', mood: 3, content: 'Gammalt inlägg.' }];

		expect(requestText(buildWeeklySummaryRequest(outsideWeek, 35, 2026))).toContain('Gammalt inlägg.');
	});
});

describe('weekly_summary: routen har ingen egen requestkonstruktion kvar', () => {
	it('anropar buildern i stället för att bygga inline', async () => {
		const { readFileSync } = await import('node:fs');
		const { join } = await import('node:path');
		const route = readFileSync(
			join(process.cwd(), 'src/routes/api/diary/weekly-summary/+server.ts'),
			'utf8'
		);

		expect(route).toContain('buildWeeklySummaryRequest(entries, weekNumber, year)');
		// Ingen kvarvarande promptcopy eller egen requestuppsättning i handlern.
		expect(route).not.toContain('Sammanfatta dagboksinlägg');
		expect(route).not.toContain("purpose: 'weekly-summary'");
		expect(route).not.toContain('const entriesText');
	});
});
