import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const streak = Math.min(Math.max(parseInt(url.searchParams.get('streak') ?? '0', 10) || 0, 0), 365);
	const total = Math.min(Math.max(parseInt(url.searchParams.get('total') ?? '0', 10) || 0, 0), 10000);
	const weekly = Math.min(Math.max(parseInt(url.searchParams.get('weekly') ?? '0', 10) || 0, 0), 50);

	// Build OG title
	let ogTitle = 'Jag tar hand om mig själv 🌱 | MittPsyke';
	if (streak >= 7) {
		ogTitle = `${streak} dagar i rad av självomvårdnad 🌱 | MittPsyke`;
	} else if (streak >= 1) {
		ogTitle = `${streak} dagar i rad — jag tar hand om mig 🌱 | MittPsyke`;
	} else if (total >= 1) {
		ogTitle = `${total} incheckningar med mig själv 🌱 | MittPsyke`;
	}

	const ogDescription =
		total > 0
			? `${total} incheckningar totalt. En person tar hand om sitt psyke — på www.mittpsyke.se`
			: 'En lugn plats att checka in med sig själv — på www.mittpsyke.se';

	return { streak, total, weekly, ogTitle, ogDescription };
};
