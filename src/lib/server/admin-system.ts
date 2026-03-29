import type { SupabaseClient } from '@supabase/supabase-js';

export const LANDING_PAGE_STATUSES = ['draft', 'published', 'planned'] as const;
export const SEO_PROMPT_TYPES = ['seo-title', 'seo-meta', 'heading', 'cta', 'keywords'] as const;
export const AB_VARIANTS = ['A', 'B'] as const;
export const LANDING_EVENT_TYPES = ['view', 'conversion', 'click'] as const;

export type LandingPageStatus = (typeof LANDING_PAGE_STATUSES)[number];
export type SeoPromptType = (typeof SEO_PROMPT_TYPES)[number];
export type AbVariant = (typeof AB_VARIANTS)[number];
export type LandingEventType = (typeof LANDING_EVENT_TYPES)[number];

export type LandingPageRecord = {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	page_id: string;
	name: string;
	slug: string;
	status: LandingPageStatus;
	conversions: number;
	views: number;
	description: string | null;
};

export type LandingPageContentRecord = {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	landing_page_id: string;
	html_content: string | null;
	seo_title: string | null;
	seo_meta: string | null;
	h1_heading: string | null;
	cta_text: string | null;
	keywords: string | null;
};

export type SeoPromptRecord = {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	landing_page_id: string;
	prompt_type: SeoPromptType;
	generated_content: string;
	used: boolean;
};

export type AbTestRecord = {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	ended_at: string | null;
	landing_page_id: string;
	variant_a_name: string | null;
	variant_b_name: string | null;
	conversions_a: number;
	conversions_b: number;
	views_a: number;
	views_b: number;
	winner: AbVariant | null;
	is_active: boolean;
};

export type LandingPageWithContent = LandingPageRecord & {
	content: LandingPageContentRecord | null;
	activeAbTest: AbTestRecord | null;
};

type SupabaseErrorLike = {
	code?: string | null;
	message?: string | null;
	details?: string | null;
	hint?: string | null;
};

export function isMissingSupabaseResourceError(
	error: SupabaseErrorLike | null | undefined,
	resourceName?: string
) {
	if (!error) return false;

	const haystack = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`;
	const missingCodes = new Set(['PGRST205', '42P01', 'PGRST202', '42883']);

	return (
		missingCodes.has(error.code ?? '') ||
		(resourceName ? haystack.includes(resourceName) : false) ||
		haystack.includes('Could not find the table') ||
		haystack.includes('function') ||
		haystack.includes('does not exist')
	);
}

export function normalizeLandingPageSlug(input: string) {
	const cleaned = input
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9\-/_åäö]/g, '')
		.replace(/\/+/g, '/');

	const withSlash = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
	return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}

export function parseInteger(value: FormDataEntryValue | string | null | undefined, fallback = 0) {
	if (typeof value !== 'string') return fallback;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export function asNullableString(value: FormDataEntryValue | null | undefined) {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function calculateAbTestWinner(test: Pick<AbTestRecord, 'views_a' | 'views_b' | 'conversions_a' | 'conversions_b'>) {
	const rateA = test.views_a > 0 ? test.conversions_a / test.views_a : null;
	const rateB = test.views_b > 0 ? test.conversions_b / test.views_b : null;

	if (rateA === null && rateB === null) {
		return {
			winner: null as AbVariant | null,
			summary: 'Minst en variant behöver visningar innan en vinnare kan räknas fram.'
		};
	}

	if (rateA !== null && rateB !== null) {
		if (rateA > rateB) {
			return { winner: 'A' as AbVariant, summary: `Variant A leder med ${(rateA * 100).toFixed(1)}% konvertering.` };
		}
		if (rateB > rateA) {
			return { winner: 'B' as AbVariant, summary: `Variant B leder med ${(rateB * 100).toFixed(1)}% konvertering.` };
		}
	}

	if (test.conversions_a > test.conversions_b) {
		return { winner: 'A' as AbVariant, summary: 'Variant A har flest konverteringar och används som vinnare.' };
	}

	if (test.conversions_b > test.conversions_a) {
		return { winner: 'B' as AbVariant, summary: 'Variant B har flest konverteringar och används som vinnare.' };
	}

	return {
		winner: null as AbVariant | null,
		summary: 'Testet är jämnt just nu. Samla fler visningar eller konverteringar innan du väljer vinnare.'
	};
}

export async function getLandingPageByPageId(supabase: SupabaseClient, pageId: string) {
	const { data: page, error: pageError } = await supabase
		.from('landing_pages')
		.select('id, created_at, updated_at, page_id, name, slug, status, conversions, views, description')
		.eq('page_id', pageId)
		.maybeSingle<LandingPageRecord>();

	if (pageError) {
		return { page: null, content: null, abTest: null, error: pageError };
	}

	if (!page) {
		return { page: null, content: null, abTest: null, error: null };
	}

	const [contentResult, abTestResult] = await Promise.all([
		supabase
			.from('landing_page_content')
			.select(
				'id, created_at, updated_at, landing_page_id, html_content, seo_title, seo_meta, h1_heading, cta_text, keywords'
			)
			.eq('landing_page_id', page.id)
			.maybeSingle<LandingPageContentRecord>(),
		supabase
			.from('ab_tests')
			.select(
				'id, created_at, updated_at, ended_at, landing_page_id, variant_a_name, variant_b_name, conversions_a, conversions_b, views_a, views_b, winner, is_active'
			)
			.eq('landing_page_id', page.id)
			.eq('is_active', true)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle<AbTestRecord>()
	]);

	return {
		page,
		content: contentResult.data ?? null,
		abTest: abTestResult.data ?? null,
		error: contentResult.error ?? abTestResult.error ?? null
	};
}
