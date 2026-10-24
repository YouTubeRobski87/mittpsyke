// Direktlänken från Framsteg till en anteckning i Dagboken.

import { describe, expect, it } from 'vitest';
import {
	diaryEntryHref,
	linkedEntryPlacement,
	pageForEntry,
	readLinkedEntryId
} from '$lib/diary-entry-link';

describe('diaryEntryHref', () => {
	it('bygger länken av anteckningens id', () => {
		expect(diaryEntryHref('3f1c2a9e-1b2c-4d5e-8f90-123456789abc')).toBe(
			'/dagbok/checkin?anteckning=3f1c2a9e-1b2c-4d5e-8f90-123456789abc'
		);
		expect(diaryEntryHref('42')).toBe('/dagbok/checkin?anteckning=42');
	});

	it('ger ingen länk utan ett användbart id', () => {
		expect(diaryEntryHref(null)).toBeNull();
		expect(diaryEntryHref(undefined)).toBeNull();
		expect(diaryEntryHref('   ')).toBeNull();
		// Ett "id" med text, mellanslag eller tecken från en URL används aldrig.
		expect(diaryEntryHref('sov dåligt')).toBeNull();
		expect(diaryEntryHref('a&b=c')).toBeNull();
	});
});

describe('readLinkedEntryId', () => {
	it('läser id:t ur länken', () => {
		expect(readLinkedEntryId(new URLSearchParams('anteckning=abc-123'))).toBe('abc-123');
	});

	it('ignorerar saknade eller ogiltiga värden', () => {
		expect(readLinkedEntryId(new URLSearchParams(''))).toBeNull();
		expect(readLinkedEntryId(new URLSearchParams('anteckning='))).toBeNull();
		expect(readLinkedEntryId(new URLSearchParams('anteckning=%3Cscript%3E'))).toBeNull();
		expect(readLinkedEntryId(null)).toBeNull();
	});
});

describe('pageForEntry', () => {
	const entries = Array.from({ length: 25 }, (_, index) => ({ id: `e${index}` }));

	it('hittar sidan i listan där anteckningen ligger', () => {
		expect(pageForEntry(entries, 'e0', 10)).toBe(1);
		expect(pageForEntry(entries, 'e9', 10)).toBe(1);
		expect(pageForEntry(entries, 'e10', 10)).toBe(2);
		expect(pageForEntry(entries, 'e24', 10)).toBe(3);
	});

	it('ger null när anteckningen inte finns i listan', () => {
		expect(pageForEntry(entries, 'okänd', 10)).toBeNull();
	});
});

describe('linkedEntryPlacement', () => {
	const entry = { id: 'e1' };

	it('öppnar anteckningen i listan när den finns där', () => {
		expect(linkedEntryPlacement({ status: 'found', entry }, [{ id: 'e0' }, entry])).toBe('list');
	});

	it('visar anteckningen för sig när den ligger längre bak än listan', () => {
		expect(linkedEntryPlacement({ status: 'found', entry }, [{ id: 'e0' }])).toBe('separate');
	});

	it('visar en lugn rad när anteckningen inte gick att hämta', () => {
		expect(linkedEntryPlacement({ status: 'missing' }, [])).toBe('missing');
	});

	it('visar inget extra utan länk', () => {
		expect(linkedEntryPlacement({ status: 'none' }, [entry])).toBe('none');
		expect(linkedEntryPlacement(undefined, [entry])).toBe('none');
	});
});
