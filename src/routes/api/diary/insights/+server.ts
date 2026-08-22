import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import type { DiaryInsightRow } from '$lib/server/diary-insight-analysis';
import { buildSupportView } from '$lib/server/diary-support-suggestions';
import {
	buildProgressAnalysis,
	filterProgressRows,
	type ProgressPeriodDays
} from '$lib/server/progress-analysis';
import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';

const INSIGHTS_ROW_LIMIT = 500;
const VALID_PERIODS = new Set<ProgressPeriodDays>([30, 90, 180]);
function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		if (!hasSensitiveConsentHeader(request)) {
			return json({ error: 'Consent required for sensitive AI features.' }, { status: 403 });
		}

		const token = getAccessToken(request.headers.get('authorization'));
		if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

		const supabaseUrl = privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = privateEnv.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
		if (!supabaseUrl || !supabaseAnonKey) {
			console.error('Missing Supabase configuration for diary insights.');
			return json({ error: 'Server configuration error.' }, { status: 500 });
		}

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();
		if (authError || !user) return json({ error: 'Unauthorized' }, { status: 401 });

		const { data: entries, error } = await supabase
			.from('diary')
			.select('created_at, mood, text, tags')
			.eq('user_id', user.id)
			// Begränsningen ska alltid prioritera det användaren nyligen lagt till.
			// Analysen sorterar tillbaka raderna kronologiskt innan den jämför
			// perioder, så den läser aldrig äldre data på bekostnad av nya mönster.
			.order('created_at', { ascending: false })
			.limit(INSIGHTS_ROW_LIMIT);

		if (error) return json({ error: error.message }, { status: 500 });

		const rows = ((entries ?? []) as DiaryInsightRow[])
			.slice()
			.sort((first, second) => (first.created_at ?? '').localeCompare(second.created_at ?? ''));
		const requestedPeriod = Number(url.searchParams.get('period') ?? '30');
		const period: ProgressPeriodDays = VALID_PERIODS.has(requestedPeriod as ProgressPeriodDays)
			? requestedPeriod as ProgressPeriodDays
			: 30;
		// Allt faktaunderlag räknas lokalt på servern ur vald period. Ingen
		// språkmodell får formulera eller utvidga personliga samband från råtext.
		const analysis = buildProgressAnalysis(rows, period);
		const support = buildSupportView(filterProgressRows(rows, period));

		return json({
			analysis,
			support
		});
	} catch (err) {
		console.error('Insights error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
