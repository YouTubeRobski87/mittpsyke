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
		// Kortets ingress klipps vid tre rader (.article-excerpt). Hålls därför
		// kortare än sidans meta description, som är längre och ligger i
		// routens +page.js - de två behöver inte vara samma text.
		description:
			'När en familjekris väcker rädsla, ensamhet och gamla konflikter. Få stöd att förstå det du känner.',
		url: '/nar-familjen-ar-i-kris',
		collection: 'relationer-och-samhalle',
		date: '2026-07-31',
		image: '/uploads/familjekris.webp',
		imageAlt:
			'En familj sitter och samtalar i ett vardagsrum medan en person sitter för sig själv i förgrunden, vänd bort från de andra.'
	}
];

export function getFeaturedPagesForCollection(collection: string) {
	return featuredPages.filter((page) => page.collection === collection);
}
