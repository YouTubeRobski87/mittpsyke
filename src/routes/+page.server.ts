import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		title: 'När tankarna snurrar – skriv av dig anonymt direkt',
		description:
			'Få hjälp att sortera, förstå och sätta ord på det som känns. MittPsyke är ett lugnt första steg i text – inte vård eller akuthjälp. Inget konto krävs för att börja.'
	};
};
