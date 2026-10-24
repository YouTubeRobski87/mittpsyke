import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

describe('/blogg/amne/medicin-och-halsa/adhd-lakemedel-och-dodlighet', () => {
	it('laddar den publicerade artikeln med rätt ämne, metadata och bild', () => {
		const result = load({
			params: {
				collection: 'medicin-och-halsa',
				slug: 'adhd-lakemedel-och-dodlighet'
			}
		} as Parameters<typeof load>[0]) as ReturnType<typeof load> & {
			article: {
				title: string;
				image: string;
				imageAlt: string;
				dateLabel: string;
				updatedLabel: string | null;
				content: string;
			};
			topic: { slug: string; label: string; icon: string };
		};

		expect(result.topic).toMatchObject({
			slug: 'medicin-och-halsa',
			label: 'Medicin och hälsa',
			icon: 'heart-pulse'
		});
		expect(result.article).toMatchObject({
			title: 'ADHD-läkemedel kopplas till lägre risk för tidig död i stor studie',
			image: '/uploads/ADHD-lakemedel-och-minskad-dodlighet.png',
			imageAlt: 'Illustration om ADHD-läkemedel och forskning kring dödlighet',
			dateLabel: '20 oktober 2026',
			updatedLabel: null
		});
		expect(result.article.content).not.toContain('<h2>ADHD-läkemedel kopplas');
		expect(result.article.content).toContain('<strong>Av Jess Cockerill</strong>');
		expect(result.article.content).toContain('<strong>Tillsammans omfattar data mer än 15,9 miljoner deltagare</strong>');
		expect(result.article.content).toContain('<blockquote>');
		expect(result.article.content).not.toContain('<pre>');
		expect(result.article.content).not.toMatch(/\+\+|\*\*###/);
		expect(result.article.content.match(/<h2>/g)).toHaveLength(2);
	});
});
