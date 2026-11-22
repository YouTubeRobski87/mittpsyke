import { describe, expect, it } from 'vitest';
import { classifyInternalLink, knownStaticRoutePaths } from '$lib/server/article-content';
import { getArticleTopic } from './article-topic';
import { allArticleNextStepHrefs, getArticleNextStep, splitArticleContent } from './article-next-step';

const section = (n: number) => `<h2>Avsnitt ${n}</h2><p>Text ${n}.</p>`;

describe('splitArticleContent', () => {
	it('delar före en rubrik ungefär en tredjedel in och tappar ingen text', () => {
		const html = '<p>Ingress.</p>' + [1, 2, 3, 4, 5, 6].map(section).join('');
		const { before, after } = splitArticleContent(html);
		expect(before + after).toBe(html);
		expect(after.startsWith('<h2>Avsnitt 3</h2>')).toBe(true);
	});

	it('delar inte korta artiklar', () => {
		const html = [1, 2].map(section).join('');
		expect(splitArticleContent(html)).toEqual({ before: html, after: '' });
	});

	it('delar aldrig mitt i en lista eller ett citat', () => {
		const html =
			section(1) + '<ul><li><h2>I listan</h2></li></ul>' + section(2) + section(3) + section(4);
		const { before, after } = splitArticleContent(html);
		expect(before + after).toBe(html);
		expect((before.match(/<ul\b/g) ?? []).length).toBe((before.match(/<\/ul>/g) ?? []).length);
		expect(after.startsWith('<h2>I listan')).toBe(false);
	});

	it('lämnar texten hel när ingen säker plats finns', () => {
		const html = '<div>' + [1, 2, 3, 4].map(section).join('') + '</div>';
		expect(splitArticleContent(html)).toEqual({ before: html, after: '' });
	});
});

describe('getArticleNextStep', () => {
	it('pekar bara på sidor som finns', () => {
		for (const href of allArticleNextStepHrefs) {
			const check = classifyInternalLink(href);
			if (check.kind === 'dynamic-route') {
				expect(check.valid, href).toBe(true);
			} else if (check.kind === 'static-route') {
				expect(knownStaticRoutePaths.has(check.path), href).toBe(true);
			} else {
				throw new Error(`${href} kan inte verifieras (${check.kind})`);
			}
		}
	});

	it('anpassar övning och ton efter ämnet', () => {
		const tankar = getArticleNextStep(getArticleTopic('overtanker-allt'));
		expect(tankar.pillarSlug).toBe('overtankande');
		expect(tankar.exerciseHref).toBe('/ovningar/tankefallor-kartlaggning');

		const socialen = getArticleNextStep(getArticleTopic('hjalp-med-bostad-av-socialen'));
		expect(socialen.early.href).toBe('/chat');
		expect(socialen.pillarSlug).toBeUndefined();
	});

	it('ger kvälls- och sömnartiklarna ett kvällssteg', () => {
		for (const [slug, collection] of [
			['angest-nar-man-ska-lagga-sig', 'oro-och-stress'],
			['radd-for-att-somna', 'oro-och-stress'],
			['adhd-somn-dygnsrytm-mittpsyke', 'medicin-och-halsa']
		]) {
			expect(getArticleTopic(slug, collection), slug).toBe('kvall');
			const step = getArticleNextStep(getArticleTopic(slug, collection));
			expect(step.pillarSlug).toBe('sovproblem');
			expect(step.exerciseHref).toBe('/ovningar/dagens-avslut-reflektion');
			expect(step.early.href).toBe('/ovningar/dagens-avslut-reflektion');
		}
		// Panik mitt i natten och hjärtklappning behåller sina kroppsnära övningar.
		expect(getArticleTopic('vaknar-med-panik-pa-natten', 'oro-och-stress')).toBe('oro');
		expect(getArticleTopic('hjartklappning-pa-kvallen', 'oro-och-stress')).toBe('stress');
	});

	it('ger inte sorgartikeln rubriken om nedstämdhet', () => {
		expect(getArticleNextStep(getArticleTopic('vad-sager-man-i-sorg')).pillarSlug).toBeUndefined();
	});

	it('använder samlingen för lokala artiklar utan träff på slugen', () => {
		expect(getArticleTopic('bemota-inre-kritikern', 'sjalvkansla-och-sjalvbild')).toBe('sjalvkansla');
		expect(getArticleTopic('introvert-eller-blyg', 'oro-och-stress')).toBe('oro');
		expect(getArticleTopic('adhd-lakemedel-och-dodlighet', 'medicin-och-halsa')).toBe('allmant');
	});
});
