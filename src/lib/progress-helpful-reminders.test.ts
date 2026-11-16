import { describe, expect, it } from 'vitest';
import { activeHelpfulReminders, mergeHelpfulReminderStates, readHelpfulReminderStates } from './progress-helpful-reminders';

describe('sortering och revisioner i Hjälper mig-listan', () => {
	it('avvisar okända val och ogiltiga revisioner i svaret', () => {
		expect(() => readHelpfulReminderStates([{ item_id: 'fritext', active: true, revision: 1 }])).toThrow();
		expect(() => readHelpfulReminderStates([{ item_id: 'rest', active: true, revision: 0 }])).toThrow();
	});

	it('slår samman ändringar per val och ignorerar sena svar före borttagning', () => {
		const removed = { item_id: 'music', active: false, revision: 2 } as const;
		const old = { item_id: 'music', active: true, revision: 1 } as const;
		const rest = { item_id: 'rest', active: true, revision: 1 } as const;
		const rows = mergeHelpfulReminderStates([removed], [old, rest]);
		expect(rows).toEqual([removed, rest]);
		expect(activeHelpfulReminders(rows)).toEqual(['rest']);
		expect(mergeHelpfulReminderStates(rows, [])).toEqual(rows);
	});
});