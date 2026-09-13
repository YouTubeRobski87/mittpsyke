import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { TOPICS } from '$lib/server/diary-insight-analysis';
import { buildSupportView } from '$lib/server/diary-support-suggestions';
import { buildProgressAnalysis, filterProgressRows } from '$lib/server/progress-analysis';
import { buildLighterDaysView } from '$lib/server/progress-lighter-days';
import { loadProgressRows, parseProgressPeriod, readThemeOverrides } from '$lib/server/progress-rows';
import { applyThemeOverridesToSupport, isThemeHidden } from '$lib/progress-theme-overrides';
import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';

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

		const period = parseProgressPeriod(url.searchParams.get('period'));
		// Läsningen är alltid scopad till den verifierade användaren och vald period.
		const { rows, truncated, error } = await loadProgressRows(supabase, user.id, period);
		if (error) return json({ error }, { status: 500 });

		// Användarens egna temakorrigeringar. De ändrar bara analysen, aldrig
		// inläggen, och ett dolt tema tas bort ur alla delar av återblicken.
		const themeOverrides = readThemeOverrides(user);
		const visibleTopics = TOPICS.filter((topic) => !isThemeHidden(themeOverrides, topic.label));

		// Allt faktaunderlag räknas lokalt på servern ur vald period. Ingen
		// språkmodell körs här; AI-sammanfattningen är ett eget, valbart anrop.
		const analysis = buildProgressAnalysis(rows, period, new Date(), { truncated, themeOverrides });
		const lighterDays = buildLighterDaysView(rows, period, themeOverrides);
		const support = applyThemeOverridesToSupport(
			buildSupportView(filterProgressRows(rows, period), { topics: visibleTopics }),
			themeOverrides
		);

		return json({
			analysis,
			lighterDays,
			support
		});
	} catch (err) {
		console.error('Insights error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
