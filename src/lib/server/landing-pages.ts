import { createServiceClient, isMissingTableError } from '$lib/server/supabase-admin';

type LandingPageRow = {
	id: string;
	page_id: string;
	name: string;
	slug: string | null;
	description: string | null;
};

type LandingPageContentRow = {
	html_content: string | null;
	seo_title: string | null;
	seo_meta: string | null;
	h1_heading: string | null;
	cta_text: string | null;
	keywords: string | null;
};

export type PublicLandingPageData = {
	pageId: string;
	pageRecordId: string | null;
	name: string;
	slug: string;
	description: string;
	seoTitle: string;
	seoMeta: string;
	h1Heading: string;
	ctaText: string;
	keywords: string[];
	htmlContent: string | null;
	canonicalUrl: string;
};

function normalizeSlug(slug: string | null | undefined) {
	if (!slug) return '/angest';
	const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
	return normalizedSlug === '/angst' ? '/angest' : normalizedSlug;
}

function splitKeywords(value: string | null | undefined) {
	if (!value) return [];

	return value
		.split(/[,\n]/)
		.map((keyword) => keyword.trim())
		.filter(Boolean)
		.slice(0, 12);
}

function getFallbackLandingPage(pageId: string): PublicLandingPageData {
	return {
		pageId,
		pageRecordId: null,
		name: 'Ångest',
		slug: '/angest',
		description:
			'Stöd för ångest i din egen takt med lugna övningar, skrivyta och anonymt samtalsstöd.',
		seoTitle: 'Hjälp vid ångest online | MittPsyke',
		seoMeta:
			'Få lugnt stöd vid ångest med samtalsstöd, dagbok och övningar. MittPsyke ersätter inte vård men kan vara en trygg första ingång.',
		h1Heading: 'Hjälp vid ångest i din egen takt',
		ctaText: 'Starta ett lugnt samtal',
		keywords: ['ångest', 'oro', 'stöd vid ångest', 'prata anonymt', 'övningar mot ångest'],
		htmlContent: null,
		canonicalUrl: 'https://www.mittpsyke.se/angest'
	};
}

export async function loadPublicLandingPage(pageId: string): Promise<PublicLandingPageData> {
	const fallback = getFallbackLandingPage(pageId);
	const serviceClient = createServiceClient();

	if (!serviceClient) {
		return fallback;
	}

	const { data: page, error: pageError } = await serviceClient
		.from('landing_pages')
		.select('id, page_id, name, slug, description')
		.eq('page_id', pageId)
		.maybeSingle<LandingPageRow>();

	if (pageError && !isMissingTableError(pageError, 'landing_pages')) {
		console.error('Landing page load error:', pageError);
	}

	if (!page) {
		return fallback;
	}

	const { data: content, error: contentError } = await serviceClient
		.from('landing_page_content')
		.select('html_content, seo_title, seo_meta, h1_heading, cta_text, keywords')
		.eq('landing_page_id', page.id)
		.maybeSingle<LandingPageContentRow>();

	if (contentError && !isMissingTableError(contentError, 'landing_page_content')) {
		console.error('Landing page content load error:', contentError);
	}

	const slug = normalizeSlug(page.slug);

	return {
		pageId: page.page_id,
		pageRecordId: page.id,
		name: page.name,
		slug,
		description: page.description?.trim() || fallback.description,
		seoTitle: content?.seo_title?.trim() || `${page.name} | MittPsyke`,
		seoMeta: content?.seo_meta?.trim() || fallback.seoMeta,
		h1Heading: content?.h1_heading?.trim() || fallback.h1Heading,
		ctaText: content?.cta_text?.trim() || fallback.ctaText,
		keywords: splitKeywords(content?.keywords).length
			? splitKeywords(content?.keywords)
			: fallback.keywords,
		htmlContent: content?.html_content ?? null,
		canonicalUrl: `https://www.mittpsyke.se${slug}`
	};
}
