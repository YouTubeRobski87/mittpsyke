import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		title: 'MittPsyke — skriv av dig anonymt och få lugnt stöd direkt',
		description:
			'Skriv av dig anonymt och få lugnt stöd direkt. MittPsyke hjälper dig att förstå psykiskt mående med dagbok, övningar och guider i din egen takt.'
	};
};
