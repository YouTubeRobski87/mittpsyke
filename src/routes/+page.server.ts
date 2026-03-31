import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		title: 'MittPsyke — AI-dagbok för mental hälsa',
		description:
			'Skriv dagbok med AI-stöd, spåra ditt humör och förstå dina känslomönster. MittPsyke är din personliga digitala dagbok för välmående.'
	};
};
