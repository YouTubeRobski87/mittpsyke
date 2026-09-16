import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Mobilnavigeringen ska spegla kärnprodukten: Skriv är den tydliga
// direktingången, chatten finns kvar men dominerar inte. Desktopnavigeringen
// är oförändrad. Testerna läser layoutens källkod, som övriga layouttester.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const layout = read('./+layout.svelte');
const home = read('./+page.svelte');

type NavEntry = { href: string; label: string };

const constants = new Map<string, NavEntry>();
for (const match of layout.matchAll(/const (\w+): NavItem = \{ href: '([^']+)', label: '([^']+)' \};/g)) {
	constants.set(match[1], { href: match[2], label: match[3] });
}

function navList(name: string): NavEntry[] {
	const header = `const ${name}: NavItem[] = [`;
	const start = layout.indexOf(header);
	expect(start, name).toBeGreaterThan(-1);
	const body = layout.slice(start + header.length, layout.indexOf('];', start));
	return [...body.matchAll(/\{ href: '([^']+)', label: '([^']+)' \}|\b([A-Z_]+_NAV_ITEM)\b/g)].map((match) => {
		if (!match[3]) return { href: match[1], label: match[2] };
		const constant = constants.get(match[3]);
		expect(constant, match[3]).toBeDefined();
		return constant as NavEntry;
	});
}

const labels = (items: NavEntry[]) => items.map((item) => item.label);
const quickNav = layout.slice(
	layout.indexOf('<nav class="mobile-quick-nav"'),
	layout.indexOf('</nav>', layout.indexOf('<nav class="mobile-quick-nav"'))
);
const mobileMenu = layout.slice(layout.indexOf('<div id="mobile-menu"'), layout.indexOf('Vid akut fara: ring 112'));

describe('mobilmenyn för utloggade', () => {
	it('prioriterar Skriv, Kvällstugan, Chatta, Läs och Om MittPsyke i den ordningen', () => {
		expect(labels(navList('mobileGuestPrimaryNavItems'))).toEqual([
			'Skriv',
			'Kvällstugan',
			'Chatta',
			'Läs',
			'Om MittPsyke'
		]);
	});

	it('skickar Skriv direkt till en ny text och Kvällstugan till startsidans förklaring', () => {
		const [write, evening] = navList('mobileGuestPrimaryNavItems');
		expect(write.href).toBe('/dagbok?action=new');
		expect(evening.href).toBe('/#kvallstugan');
		expect(home).toMatch(/<section id="kvallstugan"[^>]*aria-labelledby="evening-title"/);
	});

	it('avslutar med Sök, akut hjälp och Logga in', () => {
		const secondary = mobileMenu.slice(mobileMenu.indexOf('{:else}'));
		expect(secondary.indexOf('guestSecondaryNavItems')).toBeLessThan(secondary.indexOf('>Logga in</a>'));
		expect(mobileMenu.indexOf('href="/sok"')).toBeLessThan(mobileMenu.indexOf('>Logga in</a>'));
		expect(mobileMenu).not.toContain('>Kontakt</a>');
	});
});

describe('mobilmenyn för inloggade', () => {
	it('prioriterar Mitt Hem, Skriv, Framsteg och Läs', () => {
		const primary = navList('mobileSignedInPrimaryNavItems');
		expect(labels(primary)).toEqual(['Mitt Hem', 'Skriv', 'Framsteg', 'Läs']);
		// Mitt Hem går direkt till Kvällstugan (se navigation.test.ts). Det
		// fanns tidigare en separat Kvällstugan-rad med samma mål, men den var
		// bara en dubblett och är borttagen.
		expect(primary.map((item) => item.href)).toEqual([
			'/dashboard/kvallsstugan',
			'/dagbok/checkin',
			'/framsteg',
			'/guider'
		]);
	});

	it('lägger Chatta efter strecket, bland det sekundära', () => {
		expect(labels(navList('mobileSignedInSecondaryNavItems'))).toEqual(['Chatta', 'Om MittPsyke', 'Inställningar']);
		expect(mobileMenu).toMatch(/mobileSignedInSecondaryNavItems as item, index\}\s*\{@render mobileMenuLink\(item, index === 0 \? 'mobile-menu-group-start'/);
	});

	it('Mitt Hem markeras aktiv i Kvällstugan, eftersom det är samma route', () => {
		// isMobileActive fanns bara för att skilja Mitt Hem från en separat
		// Kvällstugan-rad med samma mål. Den raden är borta, så all
		// aktiv-markering går nu via den vanliga isActive.
		expect(layout).not.toContain('function isMobileActive');
		const primary = navList('mobileSignedInPrimaryNavItems');
		const mittHem = primary.find((item) => item.label === 'Mitt Hem');
		expect(mittHem?.href).toBe('/dashboard/kvallsstugan');
	});
});

describe('inga dubbla vägar och få toppnivålänkar', () => {
	for (const [name, lists] of [
		['gäst', ['mobileGuestPrimaryNavItems', 'mobileReadSubNavItems']],
		['inloggad', ['mobileSignedInPrimaryNavItems', 'mobileReadSubNavItems', 'mobileSignedInSecondaryNavItems']]
	] as const) {
		it(`har varje mål bara en gång i menyn (${name})`, () => {
			const hrefs = lists.flatMap((list) => navList(list).map((item) => item.href));
			expect(new Set(hrefs).size).toBe(hrefs.length);
		});
	}

	it('har högst fem huvudvägar och lägger det övriga läsbara indraget under Läs', () => {
		expect(navList('mobileGuestPrimaryNavItems')).toHaveLength(5);
		expect(navList('mobileSignedInPrimaryNavItems')).toHaveLength(4);
		expect(labels(navList('mobileReadSubNavItems'))).toEqual(['Artiklar', 'Berättelser', 'Övningar']);
		expect(mobileMenu).toMatch(/\{#if item === MOBILE_READ_NAV_ITEM\}\s*\{#each mobileReadSubNavItems as subItem\}\s*\{@render mobileMenuLink\(subItem, 'mobile-menu-sub-link'\)\}/);
		// Översikt är samma sida som ordmärket och står inte i mobilmenyn.
		expect(mobileMenu).not.toContain('signedInPortalNavItems');
	});
});

describe('snabblänken i mobilens sidhuvud', () => {
	it('är Skriv för alla, med Mitt Hem bredvid för inloggade, och aldrig chatten', () => {
		expect(quickNav).toContain('class="mobile-quick-link mobile-quick-link-write"');
		expect(quickNav).toContain('href={mobileWriteNavItem.href}');
		expect(quickNav).toMatch(/\{#if currentUser\}\s*<a\s+href="\/dashboard\/kvallsstugan"\s+class="mobile-quick-link mobile-quick-link-home"/);
		expect(quickNav).not.toContain('/chat');
		expect(layout).toContain(
			'const mobileWriteNavItem = $derived(currentUser ? SIGNED_IN_WRITE_NAV_ITEM : GUEST_WRITE_NAV_ITEM);'
		);
	});

	it('döljer bara Mitt Hem på de smalaste skärmarna, Skriv står alltid kvar', () => {
		const narrow = layout.slice(layout.indexOf('@media (max-width: 370px)'));
		const hidden = narrow.slice(0, narrow.indexOf('.site-header-inner'));
		expect(hidden).toMatch(/\.mobile-quick-link-home \{\s*display: none;/);
		expect(layout).not.toMatch(/\.mobile-quick-link-write[^{]*\{\s*display: none/);
	});

	it('har touchytor på minst 44 px', () => {
		expect(layout).toMatch(/\.mobile-quick-link \{[\s\S]*?min-height: 2\.75rem;/);
	});
});

describe('menyns beteende', () => {
	it('stängs med Escape och lämnar fokus på menyknappen', () => {
		expect(layout).toMatch(/if \(event\.key !== 'Escape'\) return;\s*mobileMenuOpen = false;\s*mobileMenuButtonRef\?\.focus\(\);/);
		expect(layout).toContain('bind:this={mobileMenuButtonRef}');
	});

	it('stängs när en länk väljs', () => {
		expect(mobileMenu).toMatch(/\{#snippet mobileMenuLink[\s\S]*?onclick=\{\(\) => \(mobileMenuOpen = false\)\}/);
	});

	it('hamnar inte bakom cookiebannern', () => {
		expect(layout).toContain('max-height: calc(100svh - 4rem - var(--cookie-banner-space, 0px));');
	});
});

describe('desktopnavigeringen', () => {
	it('är oförändrad', () => {
		expect(layout).toContain('{#each (currentUser ? signedInPortalNavItems : primaryNavItems) as item}');
		expect(labels(navList('primaryNavItems'))).toEqual([
			'Dagbok',
			'Chatta',
			'Guider',
			'Artiklar',
			'Berättelser',
			'Om MittPsyke',
			'Om skaparen'
		]);
	});
});
