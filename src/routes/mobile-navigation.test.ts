import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Navigationen ska spegla kärnprodukten: Skriv/Dagbok och Framsteg kommer
// först, chatten finns kvar men dominerar inte. Testerna läser layoutens
// källkod, som övriga layouttester.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const layout = read('./+layout.svelte');
const portalSubnav = read('../lib/components/PortalSubnav.svelte');

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
	it('prioriterar Skriv, Framsteg och därefter den sekundära chatten', () => {
		expect(labels(navList('mobileGuestPrimaryNavItems'))).toEqual([
			'Skriv',
			'Framsteg',
			'Chatta',
			'Läs',
			'Så fungerar det'
		]);
	});

	it('skickar Skriv direkt till en ny text och visar produktnyttan utan en mellanväg', () => {
		const [write, progress, chat, , how] = navList('mobileGuestPrimaryNavItems');
		expect(write.href).toBe('/dagbok?action=new');
		expect(progress.href).toBe('/framsteg');
		expect(chat.href).toBe('/chat');
		expect(how.href).toBe('/sa-fungerar-mittpsyke');
	});

	it('avslutar med Sök, akut hjälp och Logga in', () => {
		const secondary = mobileMenu.slice(mobileMenu.indexOf('{:else}'));
		expect(secondary.indexOf('guestSecondaryNavItems')).toBeLessThan(secondary.indexOf('>Logga in</a>'));
		expect(mobileMenu.indexOf('href="/sok"')).toBeLessThan(mobileMenu.indexOf('>Logga in</a>'));
		expect(mobileMenu).not.toContain('>Kontakt</a>');
	});
});

describe('mobilmenyn för inloggade', () => {
	it('prioriterar Skriv, Framsteg och Kvällstugan i kärnordning', () => {
		const primary = navList('mobileSignedInPrimaryNavItems');
		expect(labels(primary)).toEqual(['Skriv', 'Framsteg', 'Kvällstugan']);
		expect(primary.map((item) => item.href)).toEqual([
			'/dagbok/checkin#skriv-sjalv',
			'/framsteg',
			'/dashboard/kvallsstugan'
		]);
	});

	it('lägger Chatta först efter strecket och läsinnehållet därefter', () => {
		expect(labels(navList('mobileSignedInSecondaryNavItems'))).toEqual([
			'Chatta',
			'Läs',
			'Om MittPsyke',
			'Inställningar'
		]);
		expect(mobileMenu).toMatch(/mobileSignedInSecondaryNavItems as item, index\}\s*\{@render mobileMenuLink\(item, index === 0 \? 'mobile-menu-group-start'/);
		expect(mobileMenu).toMatch(/mobileSignedInSecondaryNavItems as item, index\}[\s\S]*?item === MOBILE_READ_NAV_ITEM[\s\S]*?mobileReadSubNavItems as subItem/);
	});

	it('Kvällstugan använder den vanliga aktiva route-markeringen', () => {
		expect(layout).not.toContain('function isMobileActive');
		const primary = navList('mobileSignedInPrimaryNavItems');
		const evening = primary.find((item) => item.label === 'Kvällstugan');
		expect(evening?.href).toBe('/dashboard/kvallsstugan');
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
		expect(navList('mobileSignedInPrimaryNavItems')).toHaveLength(3);
		expect(labels(navList('mobileReadSubNavItems'))).toEqual(['Artiklar', 'Berättelser', 'Övningar']);
		expect(mobileMenu).toMatch(/\{#if item === MOBILE_READ_NAV_ITEM\}\s*\{#each mobileReadSubNavItems as subItem\}\s*\{@render mobileMenuLink\(subItem, 'mobile-menu-sub-link'\)\}/);
		// Översikt är samma sida som ordmärket och står inte i mobilmenyn.
		expect(mobileMenu).not.toContain('signedInPortalNavItems');
	});
});

describe('snabblänken i mobilens sidhuvud', () => {
	it('är bara Skriv för alla och ger inte upplevelselagret samma visuella vikt', () => {
		expect(quickNav).toContain('class="mobile-quick-link mobile-quick-link-write"');
		expect(quickNav).toContain('href={mobileWriteNavItem.href}');
		expect(quickNav).not.toContain('/dashboard/kvallsstugan');
		expect(quickNav).not.toContain('/chat');
		expect(layout).toContain(
			'const mobileWriteNavItem = $derived(currentUser ? SIGNED_IN_WRITE_NAV_ITEM : GUEST_WRITE_NAV_ITEM);'
		);
	});

	it('låter Skriv stå kvar även på de smalaste skärmarna', () => {
		expect(layout).not.toContain('mobile-quick-link-home');
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

	it('ger varje menyrad en tryckyta på minst 44 px', () => {
		expect(layout).toMatch(/\.mobile-menu-link \{[\s\S]*?min-height: 2\.75rem;/);
		expect(layout).toMatch(/\.mobile-menu-link \{[\s\S]*?align-items: center;/);
	});
});

describe('desktopnavigeringen', () => {
	it('börjar med kärnnyttan publikt och samlar läsinnehåll', () => {
		expect(layout).toContain('{#each (currentUser ? signedInPortalNavItems : primaryNavItems) as item}');
		expect(labels(navList('primaryNavItems'))).toEqual([
			'Dagbok',
			'Framsteg',
			'Chatta',
			'Läs',
			'Så fungerar det'
		]);
	});

	it('ordnar inloggade vägar efter Dagbok, Framsteg, Kvällstugan och Chatta', () => {
		expect(labels(navList('signedInPortalNavItems'))).toEqual([
			'Dagbok',
			'Framsteg',
			'Kvällstugan',
			'Chatta',
			'Läs',
			'Inställningar'
		]);
	});
});

describe('inloggade undersidor', () => {
	it('använder samma kärnordning och samma namn för Kvällstugan', () => {
		const tabs = [...portalSubnav.matchAll(/\{ key: '[^']+', label: '([^']+)', href: '([^']+)' \}/g)].map(
			([, label, href]) => ({ label, href })
		);
		expect(tabs).toEqual([
			{ label: 'Dagbok', href: '/dagbok/checkin' },
			{ label: 'Framsteg', href: '/framsteg' },
			{ label: 'Kvällstugan', href: '/dashboard/kvallsstugan' },
			{ label: 'Inställningar', href: '/dashboard/installningar' }
		]);
	});
});

describe('sidfoten', () => {
	it('börjar med Dagbok och Framsteg och lyfter inte frysta sidospår', () => {
		const serviceStart = layout.indexOf('<p class="footer-col-heading">Tjänsten</p>');
		const serviceEnd = layout.indexOf('</div>', serviceStart);
		const service = layout.slice(serviceStart, serviceEnd);
		expect(service.indexOf('>Dagbok</a>')).toBeLessThan(service.indexOf('>Framsteg</a>'));
		expect(service.indexOf('>Framsteg</a>')).toBeLessThan(service.indexOf('>Chatta anonymt</a>'));
		expect(service).not.toContain('Humörspårning');
		expect(service).not.toContain('Premium');
	});
});
