import type { Portal } from '$lib/types';

export const portals: Portal[] = [
	{
		key: 'a',
		title: '\u00c5ngest',
		description: 'Trygghet, lugn och att landa i kroppen',
		icon: '\u{1F499}',
		category: 'A'
	},
	{
		key: 'b',
		title: 'Depression',
		description: 'Varsam kontakt, energi och sj\u00e4lvv\u00e4rde',
		icon: '\u{1F327}\uFE0F',
		category: 'B'
	},
	{
		key: 'e',
		title: 'Trauma',
		description: 'Kontroll, gr\u00e4nser och s\u00e4kerhet',
		icon: '\u{1F6E1}\uFE0F',
		category: 'E'
	}
];

export function getPortalByKey(key: string): Portal | undefined {
	return portals.find((p) => p.key === key);
}