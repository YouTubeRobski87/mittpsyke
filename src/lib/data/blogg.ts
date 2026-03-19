export type BlogPostCard = {
	slug: string;
	title: string;
	excerpt: string;
	readTime: string;
	publishedLabel: string;
};

export const blogPosts: BlogPostCard[] = [
	{
		slug: 'vad-ar-journalterapi',
		title: 'Vad är journalterapi – och fungerar det egentligen?',
		excerpt:
			'Lär dig vad journalterapi är, vad forskningen säger och hur du kan börja skriva på ett sätt som faktiskt håller i vardagen.',
		readTime: '8 min',
		publishedLabel: '19 mars 2026'
	},
	{
		slug: 'kbt-dagbok-vs-fri-journalforing',
		title: 'KBT-dagbok eller fri journalföring – vad passar dig?',
		excerpt:
			'Vi jämför två vanliga sätt att skriva: strukturerad tankdagbok och fri journalföring, med praktiska tips för att hitta rätt balans.',
		readTime: '9 min',
		publishedLabel: '19 mars 2026'
	},
	{
		slug: 'ai-hjalper-dig-bearbeta-kanslor',
		title: 'Hur AI kan hjälpa dig bearbeta känslor – utan att ersätta terapi',
		excerpt:
			'En trygg genomgång av vad AI kan hjälpa med i vardagen, vad som fortfarande kräver mänskligt stöd och hur integritet kan hanteras ansvarsfullt.',
		readTime: '9 min',
		publishedLabel: '19 mars 2026'
	}
];
