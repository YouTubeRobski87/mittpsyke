import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Testerna kör som i ett produktionsbygge, där åtkomstspärren faktiskt gäller.
vi.mock('$app/environment', () => ({ dev: false, browser: false, building: false }));

const { load } = await import('./+page');
const { load: serverLoad } = await import('./+page.server');

// QA-harnessen för världsstadier. Den får aldrig nås i produktion, och den
// måste montera den riktiga Framsteg-sidan - annars jämför QA en kopia.
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
	/** Kör serverspärren med en given inloggning. */
	async function gate(user: { is_super_admin: boolean } | null) {
		const locals = { getSession: vi.fn(async () => user) };
		return (serverLoad as unknown as (event: { locals: typeof locals }) => Promise<unknown>)({
			locals
		});
	}

	it('ger 404 i produktion för utloggade besökare', async () => {
		await expect(gate(null)).rejects.toMatchObject({ status: 404 });
	});

	it('ger 404 i produktion för inloggade som inte är admin', async () => {
		await expect(gate({ is_super_admin: false })).rejects.toMatchObject({ status: 404 });
	});

	it('släpper in admin i produktion', async () => {
		await expect(gate({ is_super_admin: true })).resolves.toEqual({});
	});

	it('indexeras aldrig', () => {
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
