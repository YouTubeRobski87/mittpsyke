const INDEX_TITLE = 'Artiklar om psykiskt mående';
const INDEX_DESCRIPTION =
	'Artiklar om att skriva dagbok, reflektera, oro, stress och återhämtning, och om hur skrivandet kan bli ett stöd för ditt mående.';

// Varje sida i pagineringen är en egen sida för sökmotorerna: egen canonical,
// egen titel och egen beskrivning. Tidigare pekade alla sidor med canonical på
// /blogg, vilket Google ignorerade (/blogg?page=9 rankade ändå). Bara page
// följer med i canonical, så att spårningsparametrar aldrig hamnar där.
export function buildBlogIndexSeo(currentPage: number, totalPages: number) {
	if (currentPage <= 1) {
		return { canonicalPath: '/blogg', title: `${INDEX_TITLE} | MittPsyke`, description: INDEX_DESCRIPTION };
	}

	return {
		canonicalPath: `/blogg?page=${currentPage}`,
		title: `${INDEX_TITLE} – sida ${currentPage} | MittPsyke`,
		description: `${INDEX_DESCRIPTION} Sida ${currentPage} av ${totalPages}.`
	};
}
