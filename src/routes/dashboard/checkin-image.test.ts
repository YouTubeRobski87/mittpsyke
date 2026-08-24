import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardSource = readFileSync(join(process.cwd(), 'src/routes/dashboard/+page.svelte'), 'utf8');
const desktopCheckinImageUrl = '/images/diary-book-branch-cup-960.webp';
const mobileCheckinImageUrl = '/images/diary-book-branch-cup-480.webp';

function assetPath(url: string) {
	return join(process.cwd(), 'static', url.slice(1));
}

describe('dashboardens dagboksbild', () => {
	it('refererar till optimerade WebP-assets med webbvänliga filnamn', () => {
		expect(dashboardSource).toContain(`url('${desktopCheckinImageUrl}')`);
		expect(dashboardSource).toContain(`url('${mobileCheckinImageUrl}')`);
		expect(existsSync(assetPath(desktopCheckinImageUrl))).toBe(true);
		expect(existsSync(assetPath(mobileCheckinImageUrl))).toBe(true);
	});

	it('byter till den mindre varianten i dashboardens mobilbrytpunkt', () => {
		expect(dashboardSource).toContain('--checkin-image: var(--checkin-image-desktop);');
		expect(dashboardSource).toContain('--checkin-image: var(--checkin-image-mobile);');
	});

	it('laddar inte längre den stora PNG-filen i dashboarden', () => {
		expect(dashboardSource).not.toContain("url('/images/diary-book-branch-cup.png')");
		expect(dashboardSource).not.toContain('Dagboksbild%20med%20bok%2C%20kvist%20och%20kopp.png');
	});

	it('håller båda levererade filer långt under den tidigare PNG-storleken', () => {
		expect(statSync(assetPath(desktopCheckinImageUrl)).size).toBeLessThan(400 * 1024);
		expect(statSync(assetPath(mobileCheckinImageUrl)).size).toBeLessThan(250 * 1024);
	});
});
