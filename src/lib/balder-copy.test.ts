import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Så presenteras Balder för nya besökare. Han är MittPsykes enda följeslagare
// och en lugn närvaro i platsen - inte ett spel, en mätare eller en avatar.
//
// Kärntexten säger bara det som är sant i koden: Balders poser och rörelser
// läser aldrig humörvärden. Den lovar däremot inte att han är helt opåverkad av
// hur ofta man är här, eftersom små rörelser väger lite annorlunda efter
// antalet besvarade dagar (companionBond) och han kan hälsa efter en frånvaro.

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8').replace(/\s+/g, ' ');

const CORE =
	'Balder är din följeslagare i MittPsyke. Han finns med i Mitt Hem och Kvällstugan och påverkas inte av hur du mår. Det finns ingen streak och inget att prestera – han är bara en lugn närvaro som följer tiden, årstiden och platsen tillsammans med dig.';
const SHORT =
	'Balder är en lugn följeslagare som finns med i Mitt Hem och Kvällstugan. Ingen streak, ingen prestation — bara en närvaro som följer platsen över tid.';

const PAGES = {
	home: 'src/routes/+page.svelte',
	dashboard: 'src/routes/dashboard/+page.svelte',
	evening: 'src/routes/dashboard/kvallsstugan/+page.svelte',
	about: 'src/routes/om-mittpsyke/+page.svelte',
	signedInHome: 'src/lib/components/home/SignedInHome.svelte',
	cabinProof: 'src/lib/components/home/CabinProof.svelte',
	progress: 'src/routes/framsteg/+page.svelte'
} as const;

/** Synlig text och alt-texter där Balder nämns, utan kommentarer och skript. */
function balderCopy(path: string): string[] {
	const source = readFileSync(join(process.cwd(), path), 'utf8')
		.replace(/<script[\s\S]*?<\/script>/g, '')
		.replace(/<style[\s\S]*?<\/style>/g, '')
		.replace(/<!--[\s\S]*?-->/g, '');
	return source
		.split(/<\/?(?:p|h[1-6]|small|span|li|figcaption)[^>]*>/)
		// Svelte-komponenter (t.ex. <CompanionAvatar />) är kod, inte copy.
		.map((chunk) => chunk.replace(/<[A-Z][^>]*>/g, '').replace(/\s+/g, ' ').trim())
		.filter((chunk) => chunk.includes('Balder'));
}

describe('Balder presenteras likadant överallt', () => {
	it('använder kortvarianten på startsidan', () => {
		const home = read(PAGES.home);
		expect(home).toContain('<h3>Balder, vår enda följeslagare</h3>');
		expect(home).toContain(SHORT);
	});

	it('använder kärntexten i Mitt Hem och Kvällstugan', () => {
		expect(read(PAGES.dashboard)).toContain(CORE);
		expect(read(PAGES.evening)).toContain(CORE);
		expect(read(PAGES.evening)).toContain('<h2 id="evening-reassurance-title">Balder, din följeslagare</h2>');
	});

	it('förklarar hans roll på Om MittPsyke', () => {
		const about = read(PAGES.about);
		expect(about).toContain('Balder är MittPsykes enda följeslagare.');
		expect(about).toContain('Han är ingen mätare på hur du mår och inget spel att klara av.');
	});
});

describe('det Balder-copyn aldrig får säga', () => {
	const forbidden: [RegExp, string][] = [
		[/profilbild|avatar/i, 'kallar honom profilbild eller avatar'],
		[/hjälper dig|hjälpa dig|må bättre|mår bättre av/i, 'säger att han hjälper användaren må bättre'],
		[/hur ofta du är här/i, 'lovar att han är opåverkad av hur ofta man är här'],
		[/efter (hur du mår|ditt humör|ditt mående)|när du mår|speglar ditt|visar hur du mår/i, 'kopplar hans beteende till humör'],
		[/välj (din )?följeslagare|byt följeslagare|välj djur/i, 'erbjuder djurval']
	];

	for (const [name, path] of Object.entries(PAGES)) {
		it(`håller sig till lugn närvaro på ${name}`, () => {
			for (const chunk of balderCopy(path)) {
				for (const [pattern, reason] of forbidden) {
					expect(pattern.test(chunk), `${path}: ${reason}: "${chunk}"`).toBe(false);
				}
			}
		});
	}

	it('hittar faktiskt Balder-copy att granska', () => {
		const total = Object.values(PAGES).flatMap(balderCopy);
		expect(total.length).toBeGreaterThanOrEqual(8);
	});
});
