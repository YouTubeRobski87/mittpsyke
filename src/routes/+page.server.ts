import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		title: 'Skriv av dig anonymt – digital dagbok & samtalsstöd online',
		description:
			'Skriv av dig anonymt och få lugnt samtalsstöd online. Reflektera i din egen takt – utan konto och utan press.'
	};
};
