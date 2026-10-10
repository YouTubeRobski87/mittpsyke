import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const component = readFileSync(
	join(process.cwd(), 'src/lib/components/progress/FramstegComprehensionCard.svelte'),
	'utf8'
);
const page = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');

describe('Framstegs begriplighetskort', () => {
	it('visar de två frågorna och tre riktiga knappar', () => {
		expect(component).toContain('Var det tydligt vad Framsteg visar?');
		expect(component).toContain('Förstod du vad världen förändras av?');
		expect(component).toContain("{ value: 'yes', label: 'Ja' }");
		expect(component).toContain("{ value: 'partial', label: 'Delvis' }");
		expect(component).toContain("{ value: 'no', label: 'Nej' }");
		expect(component).toContain('<button');
		expect(component).toContain('type="button"');
	});

	it('skickar bara de två fasta svaren och minns ett lyckat svar lokalt', () => {
		expect(component).toContain('body: JSON.stringify({ clarity, worldChange })');
		expect(component).toContain("localStorage.setItem(STORAGE_KEY, 'answered')");
		expect(component).toContain("localStorage.getItem(STORAGE_KEY) !== 'answered'");
		expect(component).not.toContain('<textarea');
	});

	it('är sekundärt placerat efter de centrala Framsteg-korten och bara för inloggade', () => {
		const basis = page.indexOf('garden-presence-card');
		const card = page.indexOf('<FramstegComprehensionCard');
		expect(basis).toBeGreaterThan(-1);
		expect(card).toBeGreaterThan(basis);
		expect(page).toContain('<FramstegComprehensionCard enabled={!isAnonymous} />');
	});

	it('har mobilvänliga touchytor, synligt fokus och dark mode', () => {
		expect(component).toContain('min-height: 44px');
		expect(component).toContain('button:focus-visible');
		expect(component).toContain(':global(.dark) .comprehension-card');
		expect(component).toContain('@media (max-width: 340px)');
		expect(component).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
	});
});
