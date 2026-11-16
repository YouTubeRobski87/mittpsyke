import { createClient } from '@supabase/supabase-js';
import { building } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export async function requireHelpfulRemindersMigration(): Promise<void> {
	if (building || privateEnv.RENDER !== 'true') return;

	const url = publicEnv.PUBLIC_SUPABASE_URL;
	const key = privateEnv.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) throw new Error('Render: Supabase configuration is required to check the helpful reminders migration.');

	// The page uses the public URL. Account export may use the private URL.
	const urls = new Set([url, privateEnv.SUPABASE_URL || url]);
	try {
		await Promise.all([...urls].map(async (databaseUrl) => {
			const client = createClient(databaseUrl, key, {
				auth: { autoRefreshToken: false, persistSession: false }
			});
			const { data, error } = await client
				.rpc('helpful_reminders_schema_version')
				.abortSignal(AbortSignal.timeout(5000));
			if (error || data !== 1) throw new Error();
		}));
	} catch {
		throw new Error('Render: helpful reminders schema version 1 could not be verified. Apply and verify the migration before deployment.');
	}
}