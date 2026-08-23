import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardSource = readFileSync(join(process.cwd(), 'src/routes/dashboard/+page.svelte'), 'utf8');
const checkinImageUrl = '/images/diary-book-branch-cup.png';

describe('dashboardens dagboksbild', () => {
	it('refererar till en befintlig asset med webbvänligt filnamn', () => {
		expect(dashboardSource).toContain(`url('${checkinImageUrl}')`);
		expect(existsSync(join(process.cwd(), 'static', checkinImageUrl.slice(1)))).toBe(true);
	});

	it('använder inte den URL-kodade sökvägen som gav 404 i preview', () => {
		expect(dashboardSource).not.toContain('Dagboksbild%20med%20bok%2C%20kvist%20och%20kopp.png');
	});
});
