import type { SupabaseClient } from '@supabase/supabase-js';
import { readHelpfulReminderStates, type HelpfulReminder } from '$lib/progress-helpful-reminders';

export async function loadHelpfulReminders(client: SupabaseClient, userId: string) {
	const { data, error } = await client.from('user_helpful_reminders')
		.select('item_id, active, revision').eq('user_id', userId);
	if (error) throw error;
	return readHelpfulReminderStates(data);
}

export async function changeHelpfulReminder(
	client: SupabaseClient,
	item: HelpfulReminder,
	active: boolean,
	revision: number
) {
	const { data, error } = await client.rpc('set_helpful_reminder', {
		p_item_id: item, p_active: active, p_revision: revision
	});
	if (error) throw error;
	const [row] = readHelpfulReminderStates(data);
	if (!row) return null;
	if (row.item_id !== item || row.active !== active || row.revision !== revision + 1) {
		throw new Error('Unexpected reminder confirmation');
	}
	return row;
}