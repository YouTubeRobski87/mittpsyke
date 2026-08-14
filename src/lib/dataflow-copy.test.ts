import { describe, expect, it } from 'vitest';
import { dataflowCopy } from './dataflow-copy';

describe('dataflowCopy', () => {
	it('keeps the anonymous diary local until the person clears it', () => {
		expect(dataflowCopy.anonymousDiary.storage).toContain('lokalt');
		expect(dataflowCopy.anonymousDiary.storage).toContain('rensar');
		expect(dataflowCopy.anonymousDiary.transfer).toContain('skickas den inte');
		expect(dataflowCopy.anonymousDiary.transfer).toContain('OpenAI');
	});

	it('uses one non-persistent retention rule for guest chat', () => {
		expect(dataflowCopy.guestChat.retention).toContain('inte');
		expect(dataflowCopy.guestChat.retention).toContain('laddar om sidan');
		expect(dataflowCopy.guestChat.retention).not.toMatch(/24\s*timmar/i);
	});

	it('separates account storage, saved diary AI actions, and provider retention', () => {
		expect(dataflowCopy.accountChat.storage).toContain('Supabase');
		expect(dataflowCopy.savedDiary.aiTransfer).toContain('aktivt');
		expect(dataflowCopy.providerRetention).toContain('ingen separat retentionstid');
	});
});
