import { describe, expect, it } from 'vitest';
import { tools } from '$lib/data/seo-architecture';

// Övningstexterna ska låta som en lugn röst till den som läser, inte som en
// intern beskrivning eller ett krav att prestera. Samma texter läses också upp
// av Sovläge (body-scan, 4-7-8, grounding), så de måste fungera högt.

function allTexts(tool: (typeof tools)[number]): string[] {
	return [
		tool.title,
		tool.description,
		tool.purpose ?? '',
		...(tool.steps ?? []),
		...(tool.reflections ?? [])
	];
}

const FORBIDDEN: Array<[RegExp, string]> = [
	[/\banvändaren\b/i, 'intern röst, skriv "du"'],
	[/incheck-in/i, 'stavfel, skriv "check-in"'],
	[/det räknas/i, 'räknespråk'],
	[/dagar i rad/i, 'antyder att man ska göra övningen i följd'],
	[/inom \d+ timmar/i, 'tidskrav'],
	[/(fast|samma) tid varje dag/i, 'rutinkrav'],
	[/forskning visar/i, 'påstående utan källa'],
	[/parasympatiska/i, 'medicinskt påstående utan reservation'],
	[/utan att ångra dig/i, 'kan läsas som press']
];

describe('övningstexterna', () => {
	it('innehåller inga formuleringar som pressar eller lovar för mycket', () => {
		for (const tool of tools) {
			for (const text of allTexts(tool)) {
				for (const [pattern, reason] of FORBIDDEN) {
					expect(text, `${tool.slug}: ${reason}`).not.toMatch(pattern);
				}
			}
		}
	});

	it('använder inte bindestreck med mellanslag i titlarna', () => {
		for (const tool of tools) {
			expect(tool.title, tool.slug).not.toContain(' - ');
		}
	});

	it('säger i 4-7-8 vad man gör om andningsuppehållet känns obehagligt', () => {
		const breathing = tools.find((tool) => tool.slug === '4-7-8-andning');
		expect(breathing?.steps?.some((step) => /andas som vanligt/.test(step))).toBe(true);
	});

	it('säger i exponeringsövningen att man kan gå tillbaka en nivå', () => {
		const exposure = tools.find((tool) => tool.slug === 'trygghetscirkel-exponering');
		expect(exposure?.steps?.some((step) => /tryggare nivå/.test(step))).toBe(true);
	});
});
