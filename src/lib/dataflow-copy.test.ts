import { describe, expect, it } from 'vitest';
import { dataflowCopy } from './dataflow-copy';

describe('dataflowCopy', () => {
	it('keeps the anonymous diary local until the person clears it', () => {
		expect(dataflowCopy.anonymousDiary.storage).toContain('lokalt');
		expect(dataflowCopy.anonymousDiary.storage).toContain('rensar');
		expect(dataflowCopy.anonymousDiary.transfer).toContain('skickas den inte');
		expect(dataflowCopy.anonymousDiary.transfer).toContain('OpenAI');
		expect(dataflowCopy.anonymousDiary.short).toContain('skickas inte till MittPsyke eller OpenAI');
	});

	it('uses one non-persistent retention rule for guest chat', () => {
		expect(dataflowCopy.guestChat.retention).toContain('inte');
		expect(dataflowCopy.guestChat.retention).toContain('laddar om sidan');
		expect(dataflowCopy.guestChat.retention).not.toMatch(/24\s*timmar/i);
	});

	it('separates account storage, saved diary AI actions, and provider retention', () => {
		expect(dataflowCopy.accountChat.storage).toContain('Supabase');
		expect(dataflowCopy.savedDiary.aiTransfer).toContain('aktivt');
		expect(dataflowCopy.providerRetention).toContain('ingen egen lagringstid');
	});

	// Publika sidor ska beskriva vad som händer med användarens text, inte hur
	// kodbasen är granskad. Intern revisionsjargong har läckt ut hit förut.
	it('keeps internal audit language out of user-facing copy', () => {
		for (const value of Object.values(dataflowCopy).flatMap((entry) =>
			typeof entry === 'string' ? [entry] : Object.values(entry)
		)) {
			expect(value).not.toMatch(/programkod|kodbas|ZDR|MAM|behöver bekräftas/i);
		}
	});
});
