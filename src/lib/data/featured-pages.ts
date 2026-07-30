// Fristående sidor som hör hemma i artikelöversikten men inte ligger i
// src/content/articles.
//
// De här sidorna är egna Svelte-rutter för att de innehåller något markdown
// inte kan rendera - övningar med sparade fält, kopierbara mallar och liknande.
// Därför kureras de här i stället för att läggas som .md-filer.
//
// Viktigt: de behåller sin egen URL och får aldrig en /blogg/amne/-adress.
// Att lägga dem i getPublishedArticles() skulle ge samma text två adresser och
// dubbla posten i sitemap, som redan listar dem via sin riktiga sökväg.

export type FeaturedPage = {
	id: string;
	title: string;
	description: string;
	/** Sidans riktiga adress. Inte under /blogg. */
	url: string;
	/** Slug ur src/content/article-topics, så sidan hamnar under rätt ämne. */
	collection: string;
	/** ISO-datum, används både för sortering och för <time datetime>. */
	date: string;
	image: string | null;
	imageAlt: string | null;
};

export const featuredPages: readonly FeaturedPage[] = [
	{
		id: 'featured-nar-familjen-ar-i-kris',
		title: 'När familjen är i kris och du känner dig utanför',
		description:
			'När en familjekris väcker rädsla, ilska och gamla konflikter. Få stöd att förstå känslorna, pausa konflikten och uttrycka vad du behöver.',
		url: '/nar-familjen-ar-i-kris',
		collection: 'relationer-och-samhalle',
		date: '2026-07-31',
		// Ingen egen bild ännu. Kortet faller tillbaka på översiktens
		// platshållargradient, som redan är ett stött läge i .article-card.
		image: null,
		imageAlt: null
	}
];

export function getFeaturedPagesForCollection(collection: string) {
	return featuredPages.filter((page) => page.collection === collection);
}
