import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeLocalDraftStatus, describeRetrospectThreshold } from '$lib/guest-entry-feedback';
import { buildLocalRetrospect } from '$lib/diary-local-retrospect';
import type { LocalDiaryEntry } from '$lib/diary-local-history';
import { findForbiddenProgressPhrase } from '$lib/progress-language';

const DAY = 86_400_000;
const BASE = new Date('2026-09-10T20:00:00').getTime();

function entry(text: string, dayOffset: number, id: string): LocalDiaryEntry {
	const at = BASE - dayOffset * DAY;
	return { id, createdAt: at, updatedAt: at, text };
}

describe('statusraden för det lokala utkastet', () => {
	it('visar klockslag när det är känt', () => {
		expect(describeLocalDraftStatus(new Date('2026-09-10T14:32:00').getTime())).toBe(
			'Lokalt utkast i den här webbläsaren, senast kl. 14:32.'
		);
	});

	it('klarar sig utan klockslag', () => {
		expect(describeLocalDraftStatus(null)).toBe('Lokalt utkast i den här webbläsaren.');
	});

	it('kallar aldrig gästens utkast för sparat', () => {
		expect(describeLocalDraftStatus(BASE)).not.toMatch(/sparat/i);
		expect(describeLocalDraftStatus(null)).not.toMatch(/sparat/i);
	});
});

describe('förklaringen av när återblicken visas', () => {
	it('visas inte när inget är skrivet', () => {
		expect(describeRetrospectThreshold(buildLocalRetrospect([]))).toBeNull();
	});

	it('nämner regeln och antalet efter första anteckningen', () => {
		const text = describeRetrospectThreshold(buildLocalRetrospect([entry('En tung dag', 0, 'a')]));
		expect(text).toBe(
			'När du har minst 3 anteckningar från minst 2 olika dagar visas här vilka ord som återkommer i dem. Just nu finns 1 anteckning i den här webbläsaren.'
		);
	});

	it('böjer antalet vid två anteckningar', () => {
		const text = describeRetrospectThreshold(
			buildLocalRetrospect([entry('En tung dag', 0, 'a'), entry('Lite lättare', 1, 'b')])
		);
		expect(text).toContain('Just nu finns 2 anteckningar i den här webbläsaren.');
	});

	it('säger att dagarna saknas när antalet räcker men allt är från samma dag', () => {
		const text = describeRetrospectThreshold(
			buildLocalRetrospect([entry('Ett', 0, 'a'), entry('Två', 0, 'b'), entry('Tre', 0, 'c')])
		);
		expect(text).toContain('Just nu finns 3 anteckningar från samma dag.');
	});

	it('försvinner när återblicken kan visas', () => {
		const ready = buildLocalRetrospect([
			entry('Sömnen var orolig', 0, 'a'),
			entry('Sömnen igen', 1, 'b'),
			entry('Jobbet tog plats', 2, 'c')
		]);
		expect(ready.status).not.toBe('not-enough');
		expect(describeRetrospectThreshold(ready)).toBeNull();
	});

	it('innehåller inga tolkande eller förbjudna formuleringar', () => {
		const text = describeRetrospectThreshold(buildLocalRetrospect([entry('En tung dag', 0, 'a')]));
		expect(findForbiddenProgressPhrase(text ?? '')).toBeNull();
	});
});

describe('GuestQuickEntry visar återkopplingen', () => {
	const source = readFileSync(join(process.cwd(), 'src/lib/components/GuestQuickEntry.svelte'), 'utf8');

	it('har statusraden efter skrivytan, så att den syns medan man skriver på mobil', () => {
		expect(source.indexOf('class="draft-status"')).toBeGreaterThan(source.indexOf('<textarea'));
	});

	it('låter bara statusmärket i rubriken läsas upp, inte raden under skrivytan', () => {
		expect(source).toMatch(/<p class="draft-status">/);
	});

	it('visar tröskelförklaringen där återblicken senare hamnar', () => {
		expect(source).toContain('describeRetrospectThreshold(retrospect)');
	});
});
