import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import {
	getLandingPageByPageId,
	isMissingSupabaseResourceError,
	type AbVariant,
	type LandingPageContentRecord,
	type LandingPageRecord
} from '$lib/server/admin-system';
import { createServiceClient } from '$lib/server/supabase-admin';

const AB_COOKIE_NAME = 'mittpsyke-angst-variant';

const FALLBACK_PAGE: LandingPageRecord = {
	id: '',
	created_at: null,
	updated_at: null,
	page_id: 'angst',
	name: 'Ångest',
	slug: '/angest',
	status: 'published',
	conversions: 0,
	views: 0,
	description:
		'Få stöd för ångest och oro i lugn takt. Prata anonymt, skriv av dig och hitta enkla nästa steg.'
};

const FALLBACK_CONTENT: LandingPageContentRecord = {
	id: '',
	created_at: null,
	updated_at: null,
	landing_page_id: '',
	html_content: `
		<p>Ångest kan kännas överväldigande, tröttande och svårt att förklara för andra. Här kan du stanna upp, sortera tankarna och möta det som känns svårt i din egen takt.</p>
		<p>MittPsyke är en första lugn ingång. Du kan börja anonymt, skriva fritt i dagboken eller läsa guider som hjälper dig att förstå vad som händer i kroppen och tankarna.</p>
	`,
	seo_title: 'Hjälp vid ångest – prata anonymt',
	seo_meta:
		'Få stöd för ångest och oro. Prata anonymt, skriv av dig och hitta enkla steg som kan ge lite mer lugn.',
	h1_heading: 'Hjälp vid ångest i din egen takt',
	cta_text: 'Starta ett lugnt samtal',
	keywords: 'ångest, oro, ångesthjälp, stöd online'
};

function resolveVariant(existing: string | undefined): AbVariant {
	if (existing === 'A' || existing === 'B') return existing;
	return Math.random() >= 0.5 ? 'A' : 'B';
}

export const load: PageServerLoad = async ({ cookies }) => {
	const client = createServiceClient();
	const result = client
		? await getLandingPageByPageId(client, 'angst')
		: { page: null, content: null, abTest: null, error: null };

	if (result.error && !isMissingSupabaseResourceError(result.error, 'landing_pages')) {
		console.error('Angest landing page load error:', result.error);
	}

	const page = result.page ?? FALLBACK_PAGE;
	const content: LandingPageContentRecord = {
		...FALLBACK_CONTENT,
		...(result.content ?? {}),
		landing_page_id: result.content?.landing_page_id ?? result.page?.id ?? ''
	};
	const abTest = result.abTest ?? null;

	let variant: AbVariant | null = null;
	let ctaText = content.cta_text ?? FALLBACK_CONTENT.cta_text ?? 'Starta ett lugnt samtal';

	if (abTest) {
		variant = resolveVariant(cookies.get(AB_COOKIE_NAME));
		cookies.set(AB_COOKIE_NAME, variant, {
			path: '/',
			maxAge: 60 * 60 * 24 * 30,
			sameSite: 'lax',
			secure: !dev,
			httpOnly: false
		});

		if (variant === 'A' && abTest.variant_a_name) {
			ctaText = abTest.variant_a_name;
		}
		if (variant === 'B' && abTest.variant_b_name) {
			ctaText = abTest.variant_b_name;
		}
	}

	const seoTitle = content.seo_title ?? FALLBACK_CONTENT.seo_title ?? 'Hjälp vid ångest – prata anonymt';
	const seoDescription =
		content.seo_meta ??
		page.description ??
		FALLBACK_PAGE.description ??
		'Få stöd för ångest och oro i lugn takt.';

	return {
		title: seoTitle,
		description: seoDescription,
		page,
		content: {
			...content,
			cta_text: ctaText
		},
		abTest,
		variant,
		noindex: Boolean(result.page && result.page.status !== 'published'),
		analytics: {
			landingPageId: page.id || null,
			abTestId: abTest?.id ?? null,
			variant
		},
		lastUpdated: content.updated_at ?? page.updated_at ?? '2026-03-14'
	};
};
