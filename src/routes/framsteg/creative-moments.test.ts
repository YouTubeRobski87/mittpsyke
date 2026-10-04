import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const server = readFileSync(new URL('./+page.server.ts', import.meta.url), 'utf8');
const card = page.slice(
	page.indexOf('{#snippet creativeMomentsCard()}'),
	page.indexOf('{/snippet}', page.indexOf('{#snippet creativeMomentsCard()}'))
);

describe('Kreativa stunder i Framsteg', () => {
	it('visar sektionen både i tomläget och i den vanliga inloggade vyn', () => {
		expect(card).toContain('Kreativa stunder');
		expect(card).toContain('data-testid="creative-moments"');
		expect(page.match(/@render creativeMomentsCard\(\)/g)).toHaveLength(2);
		expect(page).toContain('creativeMomentCount === 0');
	});

	it('använder sjudagarsantalet från servern och ett lugnt tomläge', () => {
		expect(server).toContain('loadCreativeMomentCount(locals.supabase, user.id)');
		expect(server).toContain('creativeMomentCount: 0');
		expect(page).toContain('getCreativeMomentCopy(creativeMomentCount)');
		expect(card).toContain('Inga motiv eller färger sparas.');
	});

	it('länkar målningen till Kvällstugans aktivitetsval', () => {
		expect(card).toContain('href="/dashboard/kvallsstugan#evening-activities"');
		expect(card).toContain('Måla i världen i Kvällstugan');
	});

	it('introducerar ingen prestation, procent, streak eller poäng i sektionen', () => {
		const visibleCopy = card.replace(/<[^>]+>/g, ' ').replace(/\{[^}]+\}/g, ' ');
		expect(visibleCopy).not.toMatch(/procent|%|streak|poäng|score|målning|slutförd|badge|ranking/i);
	});
});
