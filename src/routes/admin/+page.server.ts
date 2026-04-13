import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	AB_VARIANTS,
	LANDING_PAGE_STATUSES,
	SEO_PROMPT_TYPES,
	asNullableString,
	calculateAbTestWinner,
	isMissingSupabaseResourceError,
	normalizeLandingPageSlug,
	parseInteger,
	type AbTestRecord,
	type LandingPageContentRecord,
	type LandingPageRecord,
	type SeoPromptRecord
} from '$lib/server/admin-system';

type DashboardSeoPrompt = SeoPromptRecord & {
	landing_page_name: string;
};

type DashboardAbTest = AbTestRecord & {
	landing_page_name: string;
};

type FeedbackSubmissionRecord = {
	id: string;
	created_at: string | null;
	user_id: string | null;
	experience: string;
	what_worked: string | null;
	unclear: string | null;
	missing: string | null;
	use_again: string;
	other: string | null;
};

async function requireAdmin(locals: App.Locals) {
	const user = await locals.getSession();

	if (!user?.is_super_admin) {
		throw redirect(303, '/');
	}

	return user;
}

async function ensureAdminAction(locals: App.Locals, activeTab: 'prompts' | 'pages' | 'ab' = 'prompts') {
	const user = await locals.getSession();

	if (!user?.is_super_admin) {
		return fail(403, { activeTab, error: 'Ã…tkomst nekad.' });
	}

	return user;
}

async function loadDashboardData(locals: App.Locals) {
	const [pagesResult, contentResult, promptResult, abTestResult, feedbackResult] = await Promise.all([
		locals.supabase
			.from('landing_pages')
			.select('id, created_at, updated_at, page_id, name, slug, status, conversions, views, description')
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('landing_page_content')
			.select(
				'id, created_at, updated_at, landing_page_id, html_content, seo_title, seo_meta, h1_heading, cta_text, keywords'
			)
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('seo_prompts')
			.select('id, created_at, updated_at, landing_page_id, prompt_type, generated_content, used')
			.order('created_at', { ascending: false })
			.limit(24),
		locals.supabase
			.from('ab_tests')
			.select(
				'id, created_at, updated_at, ended_at, landing_page_id, variant_a_name, variant_b_name, conversions_a, conversions_b, views_a, views_b, winner, is_active'
			)
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('feedback_submissions')
			.select('id, created_at, user_id, experience, what_worked, unclear, missing, use_again, other')
			.order('created_at', { ascending: false })
			.limit(50)
	]);

	const schemaErrorSource =
		pagesResult.error ??
		contentResult.error ??
		promptResult.error ??
		abTestResult.error ??
		null;

	const schemaError = isMissingSupabaseResourceError(schemaErrorSource)
		? 'Admin-tabellerna saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` i Supabase SQL Editor fÃ¶rst.'
		: null;

	if (schemaErrorSource && !schemaError) {
		console.error('Admin dashboard load error:', schemaErrorSource);
	}

	const landingPages = (pagesResult.data ?? []) as LandingPageRecord[];
	const pageContent = (contentResult.data ?? []) as LandingPageContentRecord[];
	const seoPrompts = (promptResult.data ?? []) as SeoPromptRecord[];
	const abTests = (abTestResult.data ?? []) as AbTestRecord[];
	const feedbackSubmissions = isMissingSupabaseResourceError(feedbackResult.error)
		? []
		: ((feedbackResult.data ?? []) as FeedbackSubmissionRecord[]);

	const contentByLandingPageId = new Map<string, LandingPageContentRecord>();
	for (const content of pageContent) {
		contentByLandingPageId.set(content.landing_page_id, content);
	}

	const activeAbTestByLandingPageId = new Map<string, AbTestRecord>();
	for (const test of abTests) {
		if (!test.is_active || activeAbTestByLandingPageId.has(test.landing_page_id)) continue;
		activeAbTestByLandingPageId.set(test.landing_page_id, test);
	}

	const landingPageNameById = new Map(landingPages.map((page) => [page.id, page.name]));

	return {
		schemaError,
		landingPages: landingPages.map((page) => ({
			...page,
			content: contentByLandingPageId.get(page.id) ?? null,
			activeAbTest: activeAbTestByLandingPageId.get(page.id) ?? null
		})),
		seoPrompts: seoPrompts.map((prompt) => ({
			...prompt,
			landing_page_name: landingPageNameById.get(prompt.landing_page_id) ?? 'OkÃ¤nd sida'
		})) satisfies DashboardSeoPrompt[],
		abTests: abTests.map((test) => ({
			...test,
			landing_page_name: landingPageNameById.get(test.landing_page_id) ?? 'OkÃ¤nd sida'
		})) satisfies DashboardAbTest[],
		feedbackSubmissions,
		stats: {
			pageCount: landingPages.length,
			publishedCount: landingPages.filter((page) => page.status === 'published').length,
			totalViews: landingPages.reduce((sum, page) => sum + (page.views ?? 0), 0),
			totalConversions: landingPages.reduce((sum, page) => sum + (page.conversions ?? 0), 0),
			promptCount: seoPrompts.length,
			activeTestCount: abTests.filter((test) => test.is_active).length
		}
	};
}

async function generateSeoPrompt(input: {
	apiKey: string;
	pageName: string;
	pageDescription: string | null;
	promptType: string;
	context: string | null;
}) {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': input.apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
			max_tokens: 500,
			system:
				'Du Ã¤r en svensk SEO-redaktÃ¶r fÃ¶r MittPsyke, en lugn mental wellbeing-plattform. Skriv alltid pÃ¥ enkel, varm svenska. Undvik alarmism. PÃ¥minn inte om vÃ¥rd om inte det Ã¤r relevant fÃ¶r texttypen. Svara bara med det fÃ¤rdiga textfÃ¶rslaget, utan rubriker eller fÃ¶rklaring.',
			messages: [
				{
					role: 'user',
					content: [
						`Landningssida: ${input.pageName}`,
						input.pageDescription ? `Nuvarande beskrivning: ${input.pageDescription}` : '',
						`Typ av SEO-text: ${input.promptType}`,
						input.context ? `Ã–nskat fokus: ${input.context}` : '',
						'GÃ¶r texten tydlig, trygg och sÃ¶kvÃ¤nlig fÃ¶r svenska anvÃ¤ndare.'
					]
						.filter(Boolean)
						.join('\n')
				}
			]
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Anthropic prompt generation failed:', errorText);
		throw new Error('Claude API kunde inte generera text just nu.');
	}

	const payload = (await response.json()) as {
		content?: Array<{ type: string; text?: string }>;
	};

	const text = payload.content?.find((item) => item.type === 'text')?.text?.trim() ?? '';

	if (!text) {
		throw new Error('Claude API svarade utan textinnehÃ¥ll.');
	}

	return text;
}

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals);

	const dashboard = await loadDashboardData(locals);

	return {
		title: 'Admin och SEO',
		description: 'Intern vy fÃ¶r landningssidor, SEO-fÃ¶rslag, A/B-test.',
		landingPageStatuses: LANDING_PAGE_STATUSES,
		seoPromptTypes: SEO_PROMPT_TYPES,
		abVariants: AB_VARIANTS,
		...dashboard
	};
};

export const actions: Actions = {
	generatePrompt: async ({ request, locals }) => {
		const adminUser = await ensureAdminAction(locals, 'prompts');
		if ('status' in adminUser) return adminUser;

		const formData = await request.formData();
		const landingPageId = asNullableString(formData.get('landingPageId'));
		const promptType = asNullableString(formData.get('promptType'));
		const context = asNullableString(formData.get('context'));

		if (!landingPageId || !promptType || !SEO_PROMPT_TYPES.includes(promptType as (typeof SEO_PROMPT_TYPES)[number])) {
			return fail(400, { activeTab: 'prompts', error: 'VÃ¤lj sida och prompttyp fÃ¶rst.' });
		}

		const { data: page, error: pageError } = await locals.supabase
			.from('landing_pages')
			.select('id, name, description')
			.eq('id', landingPageId)
			.maybeSingle<{ id: string; name: string; description: string | null }>();

		if (pageError) {
			if (isMissingSupabaseResourceError(pageError)) {
				return fail(500, {
					activeTab: 'prompts',
					error: 'Admin-tabellerna saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` fÃ¶rst.'
				});
			}

			console.error('Admin load landing page for prompt error:', pageError);
			return fail(500, { activeTab: 'prompts', error: 'Kunde inte lÃ¤sa landningssidan.' });
		}

		if (!page) {
			return fail(404, { activeTab: 'prompts', error: 'Landningssidan kunde inte hittas.' });
		}

		const apiKey = (env.ANTHROPIC_API_KEY || '').trim();
		if (!apiKey) {
			return fail(500, {
				activeTab: 'prompts',
				error: 'ANTHROPIC_API_KEY saknas pÃ¥ servern.'
			});
		}

		try {
			const generatedContent = await generateSeoPrompt({
				apiKey,
				pageName: page.name,
				pageDescription: page.description,
				promptType,
				context
			});

			const { error: insertError } = await locals.supabase.from('seo_prompts').insert({
				landing_page_id: landingPageId,
				prompt_type: promptType,
				generated_content: generatedContent,
				used: false
			});

			if (insertError) {
				if (isMissingSupabaseResourceError(insertError)) {
					return fail(500, {
						activeTab: 'prompts',
						error: 'SEO-prompttabellen saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` fÃ¶rst.'
					});
				}

				console.error('Admin prompt insert error:', insertError);
				return fail(500, { activeTab: 'prompts', error: 'Prompten skapades men kunde inte sparas.' });
			}

			return {
				activeTab: 'prompts',
				success: 'SEO-fÃ¶rslaget har genererats och sparats.',
				generatedPrompt: generatedContent
			};
		} catch (promptError) {
			console.error('Admin prompt generation error:', promptError);
			return fail(502, {
				activeTab: 'prompts',
				error:
					promptError instanceof Error
						? promptError.message
						: 'Claude API kunde inte generera text just nu.'
			});
		}
	},

	addLandingPage: async ({ request, locals }) => {
		const adminUser = await ensureAdminAction(locals, 'pages');
		if ('status' in adminUser) return adminUser;

		const formData = await request.formData();
		const pageId = asNullableString(formData.get('pageId'));
		const name = asNullableString(formData.get('name'));
		const description = asNullableString(formData.get('description'));
		const status = asNullableString(formData.get('status')) ?? 'draft';
		const rawSlug = asNullableString(formData.get('slug'));

		if (!pageId || !name || !rawSlug) {
			return fail(400, {
				activeTab: 'pages',
				error: 'Namn, page_id och slug behÃ¶ver fyllas i.'
			});
		}

		if (!LANDING_PAGE_STATUSES.includes(status as (typeof LANDING_PAGE_STATUSES)[number])) {
			return fail(400, {
				activeTab: 'pages',
				error: 'Ogiltig status.'
			});
		}

		const slug = normalizeLandingPageSlug(rawSlug);

		const { data: insertedPage, error: insertError } = await locals.supabase
			.from('landing_pages')
			.insert({
				page_id: pageId,
				name,
				slug,
				status,
				description
			})
			.select('id')
			.maybeSingle<{ id: string }>();

		if (insertError) {
			if (isMissingSupabaseResourceError(insertError)) {
				return fail(500, {
					activeTab: 'pages',
					error: 'Admin-tabellerna saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` fÃ¶rst.'
				});
			}

			if (insertError.code === '23505') {
				return fail(409, {
					activeTab: 'pages',
					error: 'Den sidan finns redan. Kontrollera page_id och slug.'
				});
			}

			console.error('Admin landing page insert error:', insertError);
			return fail(500, { activeTab: 'pages', error: 'Kunde inte skapa landningssidan.' });
		}

		if (insertedPage?.id) {
			const defaultHeading = name.toLowerCase() === 'Ã¥ngest' ? 'HjÃ¤lp vid Ã¥ngest i din egen takt' : name;
			const defaultMeta = description ?? `StÃ¶d och vÃ¤gledning om ${name.toLowerCase()} pÃ¥ enkel svenska.`;

			const { error: contentError } = await locals.supabase.from('landing_page_content').upsert(
				{
					landing_page_id: insertedPage.id,
					h1_heading: defaultHeading,
					seo_title: `${name} | MittPsyke`,
					seo_meta: defaultMeta,
					cta_text: 'Starta ett lugnt samtal',
					keywords: name.toLowerCase()
				},
				{ onConflict: 'landing_page_id' }
			);

			if (contentError && !isMissingSupabaseResourceError(contentError)) {
				console.error('Admin default landing content upsert error:', contentError);
			}
		}

		return {
			activeTab: 'pages',
			success: `Landningssidan "${name}" skapades.`
		};
	},

	updatePageStatus: async ({ request, locals }) => {
		const adminUser = await ensureAdminAction(locals, 'pages');
		if ('status' in adminUser) return adminUser;

		const formData = await request.formData();
		const landingPageId = asNullableString(formData.get('landingPageId'));
		const status = asNullableString(formData.get('status'));

		if (!landingPageId || !status || !LANDING_PAGE_STATUSES.includes(status as (typeof LANDING_PAGE_STATUSES)[number])) {
			return fail(400, { activeTab: 'pages', error: 'Ogiltig sida eller status.' });
		}

		const { error: updateError } = await locals.supabase
			.from('landing_pages')
			.update({ status })
			.eq('id', landingPageId);

		if (updateError) {
			if (isMissingSupabaseResourceError(updateError)) {
				return fail(500, {
					activeTab: 'pages',
					error: 'Admin-tabellerna saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` fÃ¶rst.'
				});
			}

			console.error('Admin landing page status update error:', updateError);
			return fail(500, { activeTab: 'pages', error: 'Kunde inte uppdatera statusen.' });
		}

		return {
			activeTab: 'pages',
			success: 'Sidans status uppdaterades.'
		};
	},

	deleteLandingPage: async ({ request, locals }) => {
		const adminUser = await ensureAdminAction(locals, 'pages');
		if ('status' in adminUser) return adminUser;

		const formData = await request.formData();
		const landingPageId = asNullableString(formData.get('landingPageId'));

		if (!landingPageId) {
			return fail(400, { activeTab: 'pages', error: 'Sidan kunde inte identifieras.' });
		}

		const { error: deleteError } = await locals.supabase
			.from('landing_pages')
			.delete()
			.eq('id', landingPageId);

		if (deleteError) {
			if (isMissingSupabaseResourceError(deleteError)) {
				return fail(500, {
					activeTab: 'pages',
					error: 'Admin-tabellerna saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` fÃ¶rst.'
				});
			}

			console.error('Admin landing page delete error:', deleteError);
			return fail(500, { activeTab: 'pages', error: 'Kunde inte radera sidan.' });
		}

		return {
			activeTab: 'pages',
			success: 'Landningssidan raderades.'
		};
	},

	saveLandingPageContent: async ({ request, locals }) => {
		const adminUser = await ensureAdminAction(locals, 'pages');
		if ('status' in adminUser) return adminUser;

		const formData = await request.formData();
		const landingPageId = asNullableString(formData.get('landingPageId'));

		if (!landingPageId) {
			return fail(400, { activeTab: 'pages', error: 'Sidan kunde inte identifieras.' });
		}

		const payload = {
			landing_page_id: landingPageId,
			html_content: asNullableString(formData.get('htmlContent')),
			seo_title: asNullableString(formData.get('seoTitle')),
			seo_meta: asNullableString(formData.get('seoMeta')),
			h1_heading: asNullableString(formData.get('h1Heading')),
			cta_text: asNullableString(formData.get('ctaText')),
			keywords: asNullableString(formData.get('keywords'))
		};

		const { error: contentError } = await locals.supabase
			.from('landing_page_content')
			.upsert(payload, { onConflict: 'landing_page_id' });

		if (contentError) {
			if (isMissingSupabaseResourceError(contentError)) {
				return fail(500, {
					activeTab: 'pages',
					error: 'InnehÃ¥llstabellen saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` fÃ¶rst.'
				});
			}

			console.error('Admin landing page content upsert error:', contentError);
			return fail(500, { activeTab: 'pages', error: 'Kunde inte spara sidinnehÃ¥llet.' });
		}

		return {
			activeTab: 'pages',
			success: 'SidinnehÃ¥llet sparades.'
		};
	},

	updateABTest: async ({ request, locals }) => {
		const adminUser = await ensureAdminAction(locals, 'ab');
		if ('status' in adminUser) return adminUser;

		const formData = await request.formData();
		const abTestId = asNullableString(formData.get('abTestId'));
		const landingPageId = asNullableString(formData.get('landingPageId'));

		if (!abTestId && !landingPageId) {
			return fail(400, { activeTab: 'ab', error: 'VÃ¤lj en landningssida fÃ¶r testet.' });
		}

		const isActive = formData.get('isActive') === 'true';
		const nowIso = new Date().toISOString();
		const payload = {
			landing_page_id: landingPageId,
			variant_a_name: asNullableString(formData.get('variantAName')),
			variant_b_name: asNullableString(formData.get('variantBName')),
			conversions_a: parseInteger(formData.get('conversionsA')),
			conversions_b: parseInteger(formData.get('conversionsB')),
			views_a: parseInteger(formData.get('viewsA')),
			views_b: parseInteger(formData.get('viewsB')),
			is_active: isActive,
			ended_at: isActive ? null : nowIso
		};

		if (!payload.variant_a_name || !payload.variant_b_name) {
			return fail(400, { activeTab: 'ab', error: 'BÃ¥da varianterna behÃ¶ver ett namn.' });
		}

		const query = abTestId
			? locals.supabase.from('ab_tests').update(payload).eq('id', abTestId)
			: locals.supabase.from('ab_tests').insert(payload);

		const { error: abTestError } = await query;

		if (abTestError) {
			if (isMissingSupabaseResourceError(abTestError)) {
				return fail(500, {
					activeTab: 'ab',
					error: 'A/B-tabellerna saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` fÃ¶rst.'
				});
			}

			console.error('Admin A/B test upsert error:', abTestError);
			return fail(500, { activeTab: 'ab', error: 'Kunde inte spara A/B-testet.' });
		}

		return {
			activeTab: 'ab',
			success: abTestId ? 'A/B-testet uppdaterades.' : 'A/B-testet skapades.'
		};
	},

	calculateWinner: async ({ request, locals }) => {
		const adminUser = await ensureAdminAction(locals, 'ab');
		if ('status' in adminUser) return adminUser;

		const formData = await request.formData();
		const abTestId = asNullableString(formData.get('abTestId'));

		if (!abTestId) {
			return fail(400, { activeTab: 'ab', error: 'Testet kunde inte identifieras.' });
		}

		const { data: abTest, error: loadError } = await locals.supabase
			.from('ab_tests')
			.select(
				'id, created_at, updated_at, ended_at, landing_page_id, variant_a_name, variant_b_name, conversions_a, conversions_b, views_a, views_b, winner, is_active'
			)
			.eq('id', abTestId)
			.maybeSingle<AbTestRecord>();

		if (loadError || !abTest) {
			if (isMissingSupabaseResourceError(loadError)) {
				return fail(500, {
					activeTab: 'ab',
					error: 'A/B-tabellerna saknas Ã¤nnu. KÃ¶r `supabase/admin_system.sql` fÃ¶rst.'
				});
			}

			console.error('Admin A/B test load error:', loadError);
			return fail(500, { activeTab: 'ab', error: 'Kunde inte lÃ¤sa in testet.' });
		}

		const result = calculateAbTestWinner(abTest);
		const { error: updateError } = await locals.supabase
			.from('ab_tests')
			.update({
				winner: result.winner,
				is_active: result.winner ? false : abTest.is_active,
				ended_at: result.winner ? new Date().toISOString() : abTest.ended_at
			})
			.eq('id', abTestId);

		if (updateError) {
			console.error('Admin A/B winner update error:', updateError);
			return fail(500, { activeTab: 'ab', error: 'Kunde inte uppdatera vinnaren.' });
		}

		return {
			activeTab: 'ab',
			success: result.summary
		};
	}
};

