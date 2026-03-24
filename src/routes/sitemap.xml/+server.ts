import { getGuiderSeoPaths } from '$lib/seo-kit/content';
import { canonical } from '$lib/seo-kit/seo';
import { tools } from '$lib/data/seo-architecture';

// Pillar-sidor (ångest, stress, depression etc.) – hög prioritet
const pillarPages = new Set([
	'angest',
	'depression',
	'stress',
	'oro',
	'nedstamdhet',
	'ensamhet',
	'panikattack',
	'sovproblem',
	'sjalvkansla',
	'trauma',
	'kbt'
]);

const staticPages = Array.from(
	new Set([
		'',
		'blogg',
		'blogg/vad-ar-journalterapi',
		'blogg/kbt-dagbok-vs-fri-journalforing',
		'blogg/ai-hjalper-dig-bearbeta-kanslor',
		'trauma',
		'dagbok',
		'journalforing',
		'humorsparning',
		'guider',
		'ovningar',
		'om-mittpsyke',
		'ansvar',
		'integritet',
		'psykiskt-stod-online',
		'anonymt-samtalsstod-online',
		'hjalp-vid-angest-online',
		'hjalp-vid-depression-online',
		'stod-vid-stress-online',
		'hjalp-mot-oro-online',
		'samtalsstod-vid-trauma',
		'prata-anonymt-online',
		'digital-dagbok-for-maende',
		'samtalsstod-utan-vantetid',
		'ai-samtalsstod-online',
		'andningsovningar-mot-angest',
		'ovningar-mot-angest-online',
		'4-7-8-andning-ovning',
		'exponering-ovningar-mot-angest',
		'stod-vid-ptsd-online',
		'anonym-dagbok-online',
		'chatta-anonymt-med-nagon',
		'chattstod-psykisk-ohalsa',
		'angest',
		'depression',
		'stress',
		'oro',
		'nedstamdhet',
		'ensamhet',
		'panikattack',
		'sovproblem',
		'sjalvkansla',
		'kbt'
	])
);

const LASTMOD = '2026-03-23';

// Forum – index + samtalsrum (fasta kategorier)
const forumPages = [
	'forum',
	'forum/angest-och-oro',
	'forum/nedstamdhet-och-tunga-dagar',
	'forum/stress-och-utmattning',
	'forum/somn-och-nattankar',
	'forum/relationer-och-ensamhet',
	'forum/sjalvkansla-och-sjalvkritik',
	'forum/trauma-och-svara-upplevelser',
	'forum/framsteg-och-ljusglimtar'
];

const priorityOverrides: Record<string, string> = {
	blogg: '0.7',
	'blogg/vad-ar-journalterapi': '0.7',
	'blogg/kbt-dagbok-vs-fri-journalforing': '0.7',
	'blogg/ai-hjalper-dig-bearbeta-kanslor': '0.7',
	ansvar: '0.5',
	integritet: '0.5'
};

export function GET() {
	const dynamicUrls = getGuiderSeoPaths()
		.map(
			(path) =>
				`<url><loc>${canonical(path)}</loc><lastmod>${LASTMOD}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
		)
		.join('');

	const staticUrls = staticPages
		.map((page) => {
			const loc = page === '' ? canonical('/') : canonical(page);
			let priority: string;
			if (page === '') priority = '1.0';
			else if (pillarPages.has(page)) priority = '0.9';
			else priority = priorityOverrides[page] ?? '0.8';
			return `<url><loc>${loc}</loc><lastmod>${LASTMOD}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
		})
		.join('');

	const forumUrls = forumPages
		.map((page) => {
			const loc = canonical(page);
			const priority = page === 'forum' ? '0.8' : '0.7';
			return `<url><loc>${loc}</loc><lastmod>${LASTMOD}</lastmod><changefreq>daily</changefreq><priority>${priority}</priority></url>`;
		})
		.join('');

	const toolUrls = tools
		.map(
			(tool) =>
				`<url><loc>${canonical(`/ovningar/${tool.slug}`)}</loc><lastmod>${LASTMOD}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
		)
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${dynamicUrls}${forumUrls}${toolUrls}</urlset>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8'
		}
	});
}
