import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMPANION, COMPANION_PORTRAIT_IMAGE } from './progressCompanion';
import { COMPANION_POSES, DASHBOARD_CABIN_COMPANION_PLACEMENTS } from './companionPoseManifest';
import { getCompanionVisitorAsset, getCompanionVisitorState } from './companionVisitor';

// Björnen är MittPsykes enda följeslagare. Räven får bara komma på besök,
// och varg, hundar och de tidigare SVG-djuren ska inte finnas kvar som val.
// Platsen heter Kvällstugan och funktionen där inne Kvällsincheckning -
// namnet Kvällslugn får inte komma tillbaka i något användaren ser.

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

/** Alla .svelte- och .ts-filer under en katalog, utom testerna själva. */
function sourceFiles(dir: string): string[] {
	const files: string[] = [];
	for (const name of readdirSync(join(ROOT, dir))) {
		const path = `${dir}/${name}`;
		if (statSync(join(ROOT, path)).isDirectory()) {
			files.push(...sourceFiles(path));
		} else if (/\.(svelte|ts)$/.test(name) && !name.endsWith('.test.ts')) {
			files.push(path);
		}
	}
	return files;
}

const SOURCE_FILES = sourceFiles('src');

/** Källkod plus innehållsfiler som kan nå användaren. */
const USER_FACING_FILES = [
	...SOURCE_FILES,
	...sourceFilesWithExtensions('src', /\.(md|html|json)$/),
	...sourceFilesWithExtensions('static', /\.(html|json|txt|webmanifest|xml)$/)
];
const RETIRED_COMPANION_IDS = ['wolf', 'schafer', 'australisk_shepherd', 'owl', 'rabbit', 'squirrel', 'turtle', 'dino'];

describe('björnen är den enda följeslagaren', () => {
	it('har björnen Balder som fast följeslagare med ett porträtt på disk', () => {
		expect(COMPANION).toMatchObject({ id: 'bear', name: 'Balder' });
		expect(existsSync(join(ROOT, 'static', COMPANION_PORTRAIT_IMAGE))).toBe(true);
	});

	it('har bara björnposer och björnplacering i manifestet', () => {
		expect(new Set(COMPANION_POSES.map((pose) => pose.companionId))).toEqual(new Set(['bear']));
		expect(Object.keys(DASHBOARD_CABIN_COMPANION_PLACEMENTS)).toEqual(['bear']);
		for (const frame of COMPANION_POSES.flatMap((pose) => pose.frames)) {
			expect(existsSync(join(ROOT, 'static', frame.src)), frame.src).toBe(true);
		}
	});

	it('har inget följeslagarval kvar i appen', () => {
		expect(existsSync(join(ROOT, 'src/lib/components/CompanionSelector.svelte'))).toBe(false);
		for (const file of SOURCE_FILES) {
			const source = read(file);
			expect(source, file).not.toContain('CompanionSelector');
			expect(source, file).not.toContain('progressCompanion:');
			// Kontoexporten får fortsätta lämna ut ett äldre sparat val: det ligger
			// kvar i user_metadata och är användarens egen data. Ingen annan kod
			// får läsa eller skriva fältet.
			if (file === 'src/routes/api/account/export/+server.ts') continue;
			expect(source, file).not.toContain('progress_companion');
		}
	});

	it('refererar inte till varg, hundar eller de gamla SVG-djuren i källkoden', () => {
		for (const file of SOURCE_FILES) {
			const source = read(file);
			for (const id of RETIRED_COMPANION_IDS) {
				expect(source, `${file} nämner ${id}`).not.toMatch(new RegExp(`['"\`]${id}['"\`-]`));
			}
		}
	});

	it('låter räven bara vara besökare hos björnen', () => {
		const visit = getCompanionVisitorState(
			{ mainCompanionId: COMPANION.id, isSleeping: false, sceneAllowsVisitor: true },
			0,
			null,
			() => 0
		);
		expect(visit.visitorId).toBe('fox');
		expect(getCompanionVisitorAsset('bear', 'awake')).toBeNull();

		const foxFiles = SOURCE_FILES.filter((file) => /['"]fox['"]/.test(read(file)));
		expect(foxFiles).toEqual(['src/lib/companionVisitor.ts']);
	});
});

describe('Kvällstugan och Kvällsincheckning', () => {
	const evening = read('src/routes/dashboard/kvallsstugan/+page.svelte');

	it('heter Kvällstugan i titel och rubrik', () => {
		expect(evening).toContain('<title>Kvällstugan – MittPsyke</title>');
		expect(evening).toContain('<h1 id="evening-title">Kvällstugan</h1>');
	});

	it('kallar funktionen inne i stugan för Kvällsincheckning', () => {
		expect(evening).toContain('id="evening-flow-label">Kvällsincheckning</p>');
		expect(evening).toContain('aria-labelledby="evening-flow-label"');
	});

	it('behåller den befintliga routen', () => {
		expect(existsSync(join(ROOT, 'src/routes/dashboard/kvallsstugan/+page.svelte'))).toBe(true);
		expect(read('src/routes/dashboard/+page.svelte')).toContain('href="/dashboard/kvallsstugan"');
	});

	it('använder Kvällstugan i ingången på Mitt Hem och på inloggad startsida', () => {
		const dashboard = read('src/routes/dashboard/+page.svelte');
		expect(dashboard).toContain("'Kvällstugan – logga in för att använda' : 'Gå in i Kvällstugan'");
		expect(dashboard).toContain('<span>Kvällstugan</span>');
		expect(read('src/lib/components/home/SignedInHome.svelte')).toContain('<strong>Kvällstugan</strong>');
	});

	// Det användarsynliga namnet stavas med ett s: Kvällstugan. Routen
	// /dashboard/kvallsstugan (utan ä) behålls för kompatibilitet och fångas
	// därför inte av mönstret nedan.
	it('har inte kvar stavningen Kvällsstugan i källkod, innehåll, static eller docs', () => {
		for (const file of [...USER_FACING_FILES, ...sourceFilesWithExtensions('docs', /\.md$/)]) {
			expect(read(file), file).not.toMatch(/kvällsstug/i);
		}
	});

	it('har inte kvar namnet Kvällslugn någonstans i källkod, innehåll eller static', () => {
		for (const file of USER_FACING_FILES) {
			expect(read(file), file).not.toMatch(/kvällslugn|kvallslugn/i);
		}
	});

	it('beskriver produktbeslutet i North Star', () => {
		const northStar = read('docs/NORTH_STAR.md');
		expect(northStar).toContain('Balder');
		expect(northStar).toContain('Kvällstugan');
		expect(northStar).toContain('Kvällsincheckning');
		expect(northStar).not.toMatch(/Följeslagarna|välja följeslagare|val av djur/);
	});
});

/** Filer med givna ändelser, för innehåll som inte är .svelte/.ts. */
function sourceFilesWithExtensions(dir: string, pattern: RegExp): string[] {
	const files: string[] = [];
	if (!existsSync(join(ROOT, dir))) return files;
	for (const name of readdirSync(join(ROOT, dir))) {
		const path = `${dir}/${name}`;
		if (statSync(join(ROOT, path)).isDirectory()) {
			files.push(...sourceFilesWithExtensions(path, pattern));
		} else if (pattern.test(name)) {
			files.push(path);
		}
	}
	return files;
}
