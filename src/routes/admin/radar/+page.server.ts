import { error, fail, redirect } from '@sveltejs/kit';
import { createServiceClient, isMissingTableError, isUuid } from '$lib/server/supabase-admin';
import { buildDailyBrief, type RadarRecommendedAction } from '$lib/server/radar/daily-brief';
import type { Actions, PageServerLoad } from './$types';

type RadarStatus = 'new' | 'reviewed' | 'approved' | 'ignored' | 'article_idea' | 'development_task';
type RecommendedAction = RadarRecommendedAction;

const RADAR_STATUSES: RadarStatus[] = ['new', 'reviewed', 'approved', 'ignored', 'article_idea', 'development_task'];
const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };

function getAdminClient(locals: App.Locals) {
	return createServiceClient() ?? locals.supabase;
}

/** Decode only text entities, then remove markup. External feed text is never rendered as HTML. */
function plainText(value: string | null | undefined) {
	if (!value) return null;
	let text = value;
	for (let pass = 0; pass < 2; pass += 1) {
		text = text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, token) => {
			const normalized = String(token).toLowerCase();
			if (normalized in NAMED_ENTITIES) return NAMED_ENTITIES[normalized];
			const numeric = normalized.startsWith('#x') ? Number.parseInt(normalized.slice(2), 16) : Number.parseInt(normalized.slice(1), 10);
			return Number.isInteger(numeric) && numeric >= 0 && numeric <= 0x10ffff ? String.fromCodePoint(numeric) : entity;
		});
	}
	return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || null;
}

function isBareVersion(title: string) {
	return /^(?:v)?\d+(?:\.\d+){1,3}(?:[-+][\w.-]+)?$/i.test(title.trim());
}

function displayTitle(title: string | null, provider: string | null) {
	const cleanTitle = plainText(title) ?? 'Odaterat fynd';
	const cleanProvider = plainText(provider);
	return cleanProvider && isBareVersion(cleanTitle) ? `${cleanProvider} ${cleanTitle}` : cleanTitle;
}

function looksSwedish(text: string) {
	return /\b(och|att|för|med|den|det|som|är|har|kan|en|ett)\b/i.test(text);
}

function swedishSummary(summary: string | null, provider: string | null, category: string | null, action: RecommendedAction) {
	if (summary && looksSwedish(summary)) return summary;
	const source = plainText(provider) ?? 'Källan';
	if (action === 'ignorera') return `${source} har publicerat en vanlig mindre uppdatering. Den kan lämnas utan åtgärd om inget i versionsanteckningarna berör er.`;
	if (action === 'agera_nu') return `${source} beskriver en förändring som bör kontrolleras före nästa driftsättning.`;
	if (action === 'testa_i_sandbox') return `${source} har en förändring som kan vara värd att prova i en avskild testmiljö.`;
	return `${source} har publicerat en uppdatering inom ${plainText(category) ?? 'ett bevakat område'}. Spara den till nästa relevanta genomgång.`;
}

function relevantFor(action: RecommendedAction, title: string, existing: string | null) {
	if (existing && looksSwedish(existing)) return existing;
	if (/\b(sdk|node|npm|package)\b/i.test(title)) return 'Det här är en vanlig SDK-uppdatering. Den kräver normalt ingen åtgärd för MittPsyke, Stödlinjer eller övriga projekt.';
	if (action === 'agera_nu') return 'Kontrollera om ändringen berör den aktiva lösningen i MittPsykes samtalsstöd eller Stödlinjer före nästa driftsättning.';
	if (action === 'testa_i_sandbox') return 'Det kan vara relevant att prova ändringen avskilt innan den påverkar MittPsykes eller Stödlinjers vanliga flöden.';
	return 'Spara som underlag till nästa planering om området blir aktuellt för MittPsyke, Stödlinjer eller ett annat projekt.';
}

function ageInDays(value: string | null) {
	if (!value) return null;
	const published = new Date(value).getTime();
	if (Number.isNaN(published)) return null;
	return Math.max(0, Math.floor((Date.now() - published) / 86_400_000));
}

function effectiveAction(action: string | null, title: string, summary: string | null, ageDays: number | null): RecommendedAction {
	let next: RecommendedAction = action === 'agera_nu' || action === 'testa_i_sandbox' || action === 'bevaka' || action === 'ignorera' ? action : 'ignorera';
	const haystack = `${title} ${summary ?? ''}`.toLowerCase();
	const isSdkRelease = /\b(sdk|node|npm|package)\b/.test(haystack) && /\bv?\d+\.\d+(?:\.\d+)?\b/.test(haystack);
	const urgentSignal = /\b(breaking|security|säkerhet|cve|critical|vulnerability|incident|deprecat(?:ed|ion)|migration)\b/.test(haystack);

	// A routine SDK version is useful context, not an urgent production task.
	if (isSdkRelease && !urgentSignal && next === 'agera_nu') next = 'bevaka';
	if (ageDays !== null && ageDays > 14 && !urgentSignal && (next === 'agera_nu' || next === 'testa_i_sandbox')) next = 'bevaka';
	if (ageDays !== null && ageDays > 60 && !urgentSignal) next = 'ignorera';
	return next;
}

async function checkRadarAdmin(locals: App.Locals) {
	const user = await locals.getSession();
	return { user, isAdmin: user?.is_super_admin === true };
}

async function requireAdmin(locals: App.Locals) {
	const { user, isAdmin } = await checkRadarAdmin(locals);
	if (!user) throw redirect(303, '/login?redirect=/admin/radar');
	if (!isAdmin) throw error(403, 'Du är inloggad men har inte behörighet till Radar.');
	return user;
}

async function ensureAdmin(locals: App.Locals) {
	const { user, isAdmin } = await checkRadarAdmin(locals);
	if (!user) return fail(401, { error: 'Du behöver logga in igen.' });
	if (!isAdmin) return fail(403, { error: 'Du har inte behörighet till Radar.' });
	return user;
}

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals);
	const admin = getAdminClient(locals);
	const [findingsResult, sourcesResult, runsResult] = await Promise.all([
		admin.from('radar_findings').select('id, title, url, provider, published_at, category, summary, why_it_matters, project_use, recommended_action, relevance_score, confidence_score, status, source_is_official').order('published_at', { ascending: false, nullsFirst: false }).order('discovered_at', { ascending: false }).limit(100),
		admin.from('radar_sources').select('id, name, provider, category, enabled, is_official, last_checked_at').order('provider'),
		admin.from('radar_runs').select('id, started_at, finished_at, status, sources_checked, candidates_found, findings_saved, error_message').order('started_at', { ascending: false }).limit(10)
	]);
	const loadError = findingsResult.error ?? sourcesResult.error ?? runsResult.error;
	if (loadError) {
		if (isMissingTableError(loadError, 'radar_findings')) return { findings: [], dailyBrief: buildDailyBrief([], null), sources: [], runs: [], schemaError: 'Radar-tabellerna saknas ännu.' };
		console.error('Admin radar load error:', loadError);
		return { findings: [], dailyBrief: buildDailyBrief([], null), sources: [], runs: [], schemaError: 'Radarn kunde inte hämtas just nu.' };
	}

	const findings = (findingsResult.data ?? []).map((finding) => {
		const rawSummary = plainText(finding.summary);
		const ageDays = ageInDays(finding.published_at);
		const title = displayTitle(finding.title, finding.provider);
		const recommendedAction = effectiveAction(finding.recommended_action, title, rawSummary, ageDays);
		const summary = swedishSummary(rawSummary, finding.provider, finding.category, recommendedAction);
		return {
			...finding,
			title,
			provider: plainText(finding.provider),
			summary,
			why_it_matters: relevantFor(recommendedAction, title, plainText(finding.why_it_matters)),
			project_use: plainText(finding.project_use),
			ageDays,
			archived: ageDays !== null && ageDays > 60,
			recommended_action: recommendedAction
		};
	});

	const runs = runsResult.data ?? [];
	const latestReviewedCount = runs[0]?.candidates_found ?? null;
	return {
		findings,
		dailyBrief: buildDailyBrief(findings, latestReviewedCount),
		sources: sourcesResult.data ?? [],
		runs,
		schemaError: null
	};
};

export const actions: Actions = {
	setStatus: async ({ locals, request }) => {
		const adminUser = await ensureAdmin(locals);
		if ('status' in adminUser) return adminUser;
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const status = String(form.get('status') ?? '') as RadarStatus;
		if (!isUuid(id) || !RADAR_STATUSES.includes(status)) return fail(400, { error: 'Fyndet eller statusen är inte giltig.' });
		const { error: updateError } = await getAdminClient(locals).from('radar_findings').update({ status }).eq('id', id);
		if (updateError) {
			console.error('Radar status update error:', updateError);
			return fail(500, { error: 'Statusen kunde inte sparas.' });
		}
		return { success: 'Statusen sparades.' };
	}
};
