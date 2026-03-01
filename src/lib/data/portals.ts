import type { Portal } from '$lib/types';

export const portals: Portal[] = [
	{
		key: 'a',
		title: 'Ångest',
		description: 'Trygghet, lugn och att landa i kroppen',
		icon: '💙',
		category: 'A'
	},
	{
		key: 'b',
		title: 'Depression',
		description: 'Varsam kontakt, energi och självvärde',
		icon: '🌧️',
		category: 'B'
	},
	{
		key: 'e',
		title: 'Trauma',
		description: 'Kontroll, gränser och säkerhet',
		icon: '🛡️',
		category: 'E'
	}
];

export function getPortalByKey(key: string): Portal | undefined {
	return portals.find((p) => p.key === key);
}
