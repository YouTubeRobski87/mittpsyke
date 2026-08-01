import { describe, expect, it } from 'vitest';
import {
	ACTIVE_EI_CONFIG,
	ACTIVE_EI_CONFIG_HASH,
	hashEIConfig,
	serializeEIConfig,
	type EIConfig
} from './config';
import { buildDecisionLog, FORBIDDEN_DECISION_LOG_FIELDS } from './validation';
import type { ModelDecisionClaim, RuntimeDecisionFacts } from './contracts';

const runtime: RuntimeDecisionFacts = {
	eiConfigVersion: ACTIVE_EI_CONFIG.eiConfigVersion,
	eiConfigHash: ACTIVE_EI_CONFIG_HASH,
	safetyOutcome: 'no_escalation',
	contextActuallySent: {
		conversationHistoryIncluded: true,
		authorizedMemoryIncluded: false
	}
};

const validClaim: ModelDecisionClaim = {
	responseType: 'reflective',
	contentZones: ['A', 'B'],
	contextHandling: 'used_conversation_context',
	uncertaintyHandling: 'state_uncertainty',
	memoryUse: 'conversation_only',
	principlesApplied: ['cp-1-no-rush-to-advice', 'ei-epistemic-humility']
};

describe('EIConfig-hash', () => {
	it('ger samma hash för samma konfiguration', () => {
		expect(hashEIConfig(ACTIVE_EI_CONFIG)).toBe(hashEIConfig(ACTIVE_EI_CONFIG));
		expect(hashEIConfig(ACTIVE_EI_CONFIG)).toBe(ACTIVE_EI_CONFIG_HASH);
		expect(ACTIVE_EI_CONFIG_HASH).toMatch(/^[0-9a-f]{64}$/);
	});

	it('är oberoende av i vilken ordning fälten råkar skrivas', () => {
		// Samma innehåll, omvänd nyckelordning på toppnivå och i en princip.
		const reordered = {
			instructions: ACTIVE_EI_CONFIG.instructions,
			allowedContentZones: ACTIVE_EI_CONFIG.allowedContentZones,
			allowedResponseTypes: ACTIVE_EI_CONFIG.allowedResponseTypes,
			principles: ACTIVE_EI_CONFIG.principles.map((principle) => ({
				source: principle.source,
				name: principle.name,
				id: principle.id
			})),
			eiConfigVersion: ACTIVE_EI_CONFIG.eiConfigVersion,
			schemaVersion: ACTIVE_EI_CONFIG.schemaVersion
		} as EIConfig;

		expect(hashEIConfig(reordered)).toBe(ACTIVE_EI_CONFIG_HASH);
	});

	it('ändras när innehållet ändras', () => {
		const changed: EIConfig = {
			...ACTIVE_EI_CONFIG,
			instructions: [...ACTIVE_EI_CONFIG.instructions, 'En ny instruktion.']
		};

		expect(hashEIConfig(changed)).not.toBe(ACTIVE_EI_CONFIG_HASH);
	});

	it('har unika princip-ID:n', () => {
		const ids = ACTIVE_EI_CONFIG.principles.map((principle) => principle.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('buildDecisionLog', () => {
	it('bygger en giltig logg av ett korrekt påstående', () => {
		const result = buildDecisionLog(validClaim, runtime);

		expect(result.valid).toBe(true);
		if (!result.valid) return;

		expect(result.decisionLog.eiConfigHash).toBe(ACTIVE_EI_CONFIG_HASH);
		expect(result.decisionLog.eiConfigVersion).toBe(ACTIVE_EI_CONFIG.eiConfigVersion);
		expect(result.decisionLog.safetyOutcome).toBe('no_escalation');
	});

	it('avvisar okända enumvärden', () => {
		const result = buildDecisionLog(
			{ ...validClaim, responseType: 'therapeutic_intervention' },
			runtime
		);

		expect(result.valid).toBe(false);
		if (result.valid) return;
		expect(result.errors.join('\n')).toContain('responseType');
	});

	it('avvisar en okänd zon', () => {
		const result = buildDecisionLog({ ...validClaim, contentZones: ['A', 'D'] }, runtime);
		expect(result.valid).toBe(false);
	});

	it('avvisar princip-ID som inte finns i aktiv EIConfig', () => {
		const result = buildDecisionLog(
			{ ...validClaim, principlesApplied: ['cp-1-no-rush-to-advice', 'ei-hittepa-princip'] },
			runtime
		);

		expect(result.valid).toBe(false);
		if (result.valid) return;
		expect(result.errors.join('\n')).toContain('ei-hittepa-princip');
	});

	it('låter inte modellen sätta runtime-ägda fält', () => {
		for (const field of ['eiConfigVersion', 'eiConfigHash', 'schemaVersion'] as const) {
			const result = buildDecisionLog({ ...validClaim, [field]: 'förfalskat-värde' }, runtime);

			expect(result.valid, `${field} borde ha avvisats`).toBe(false);
		}
	});

	it('låter inte modellen deklarera säkerhetsutfall', () => {
		const result = buildDecisionLog({ ...validClaim, safetyOutcome: 'no_escalation' }, runtime);

		expect(result.valid).toBe(false);
	});

	it('tar säkerhetsutfallet från runtime, inte från påståendet', () => {
		const result = buildDecisionLog(validClaim, { ...runtime, safetyOutcome: 'supportive_check_in' });

		expect(result.valid).toBe(true);
		if (!result.valid) return;
		expect(result.decisionLog.safetyOutcome).toBe('supportive_check_in');
	});

	it('avvisar förbjudna fält som confidence och answerQuality', () => {
		for (const field of FORBIDDEN_DECISION_LOG_FIELDS) {
			const result = buildDecisionLog({ ...validClaim, [field]: 'något' }, runtime);

			expect(result.valid, `${field} borde ha avvisats`).toBe(false);
		}
	});

	it('avvisar påstått minne som aldrig skickades', () => {
		const result = buildDecisionLog(
			{ ...validClaim, memoryUse: 'authorized_persistent_memory' },
			runtime
		);

		expect(result.valid).toBe(false);
		if (result.valid) return;
		expect(result.errors.join('\n')).toContain('inget minne skickades med');
	});

	it('avvisar påstådd samtalskontext när ingen historik skickades', () => {
		const result = buildDecisionLog(validClaim, {
			...runtime,
			contextActuallySent: { conversationHistoryIncluded: false, authorizedMemoryIncluded: false }
		});

		expect(result.valid).toBe(false);
	});

	// Säkerhetslagret granskar bara det aktuella meddelandet och returnerar
	// innan kontext, minne och prompt monteras. Ett krisutfall tillsammans med
	// använd historik beskriver alltså något som inte kan ha hänt.
	it('avvisar krisutfall kombinerat med använd samtalskontext', () => {
		const result = buildDecisionLog(validClaim, {
			...runtime,
			safetyOutcome: 'crisis_guidance'
		});

		expect(result.valid).toBe(false);
		if (result.valid) return;
		expect(result.errors.join('\n')).toContain('contextHandling');
	});

	it('accepterar krisutfall när bara aktuellt meddelande använts', () => {
		const result = buildDecisionLog(
			{
				...validClaim,
				contextHandling: 'used_current_message',
				memoryUse: 'none'
			},
			{ ...runtime, safetyOutcome: 'emergency_guidance' }
		);

		expect(result.valid).toBe(true);
	});
});

describe('dataminimering', () => {
	it('har inget fält för fritext i en serialiserad DecisionLog', () => {
		const userText = 'HEMLIG-ANVÄNDARTEXT-SOM-ALDRIG-FÅR-LOGGAS';

		const result = buildDecisionLog(validClaim, runtime);
		expect(result.valid).toBe(true);
		if (!result.valid) return;

		const serialized = JSON.stringify(result.decisionLog);

		expect(serialized).not.toContain(userText);
		// Loggen består enbart av de tio kontraktsfälten.
		expect(Object.keys(result.decisionLog).sort()).toEqual(
			[
				'contentZones',
				'contextHandling',
				'eiConfigHash',
				'eiConfigVersion',
				'memoryUse',
				'principlesApplied',
				'responseType',
				'safetyOutcome',
				'schemaVersion',
				'uncertaintyHandling'
			].sort()
		);
	});

	it('släpper inte igenom fritext även om modellen försöker bifoga den', () => {
		const result = buildDecisionLog(
			{ ...validClaim, notes: 'Användaren skrev att hen inte orkar mer.' },
			runtime
		);

		expect(result.valid).toBe(false);
	});

	it('innehåller ingen användartext i den serialiserade konfigurationen', () => {
		expect(serializeEIConfig(ACTIVE_EI_CONFIG)).not.toMatch(/användaren skrev/i);
	});
});
