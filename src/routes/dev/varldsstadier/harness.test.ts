import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { load } from './+page';

// QA-harnessen för världsstadier. Den får aldrig nås i produktion, och den
// måste montera den riktiga Framsteg-sidan - annars jämför QA en kopia.
const loadSource = readFileSync(join(process.cwd(), 'src/routes/dev/varldsstadier/+page.ts'), 'utf8');
const pageSource = readFileSync(join(process.cwd(), 'src/routes/dev/varldsstadier/+page.svelte'), 'utf8');

type HarnessData = {
	fixtureKeys: string[];
	progress: { worldProgress: { stage: number } };
};

function run(fixture: string): HarnessData {
	const url = new URL(`http://localhost/dev/varldsstadier?fixture=${fixture}`);
	return (load as unknown as (event: { url: URL }) => HarnessData)({ url });
}

describe('QA-harness för världsstadier', () => {
	it('svarar 404 utanför utvecklingsläge och indexeras aldrig', () => {
		expect(loadSource).toContain("import { dev } from '$app/environment'");
		expect(loadSource).toContain("if (!dev) throw error(404, 'Not found');");
		expect(pageSource).toContain('<meta name="robots" content="noindex, nofollow" />');
	});

	it('monterar den riktiga Framsteg-sidan i stället för en kopia', () => {
		expect(pageSource).toContain("import ProgressPage from '../../framsteg/+page.svelte'");
	});

	it('landar varje stadiefixture på sitt stadium', () => {
		for (const stage of [0, 1, 2, 3, 4, 5]) {
			expect(run(String(stage)).progress.worldProgress.stage).toBe(stage);
		}
	});

	it('visar att ett gammalt konto med lite historik ändå hamnar på stadium 4', () => {
		expect(run('gammalt').progress.worldProgress.stage).toBe(4);
	});
});
