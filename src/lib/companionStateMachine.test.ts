import { describe, expect, it } from 'vitest';
import { getBaseCompanionState, getCompanionDisplayState } from './companionStateMachine';

describe('getBaseCompanionState', () => {
	it('mappar björnens poser till den kanoniska ordlistan', () => {
		expect(getBaseCompanionState({ id: 'bear-standing' })).toBe('idle');
		expect(getBaseCompanionState({ id: 'bear-sitting' })).toBe('sit');
		expect(getBaseCompanionState({ id: 'bear-sleeping' })).toBe('sleep');
		expect(getBaseCompanionState({ id: 'bear-stretching' })).toBe('idle');
	});

	it('känner inte längre igen de borttagna följeslagarnas poser', () => {
		// Räv-, varg- och hundposer finns inte kvar i manifestet och får
		// därför bara den neutrala fallbacken.
		for (const id of ['sit', 'sleep-curled', 'walk', 'wolf-sleeping', 'schafer-sitting']) {
			expect(getBaseCompanionState({ id })).toBe('idle');
		}
	});

	it('falls back to idle for missing or unknown poses', () => {
		expect(getBaseCompanionState(null)).toBe('idle');
		expect(getBaseCompanionState(undefined)).toBe('idle');
		expect(getBaseCompanionState({ id: 'some-future-pose-id' })).toBe('idle');
	});
});

describe('getCompanionDisplayState', () => {
	it('reports "blink" whenever a blink overlay is active, regardless of base pose', () => {
		expect(getCompanionDisplayState({ id: 'bear-sitting' }, { motion: 'blink' })).toBe('blink');
		expect(getCompanionDisplayState({ id: 'bear-standing' }, { motion: 'blink' })).toBe('blink');
	});

	it('ignores non-blink overlays and falls back to the base state', () => {
		expect(getCompanionDisplayState({ id: 'bear-sitting' }, { motion: 'gesture' })).toBe('sit');
		expect(getCompanionDisplayState({ id: 'bear-sleeping' }, { motion: 'sleep' })).toBe('sleep');
	});

	it('falls back to the base state when there is no overlay', () => {
		expect(getCompanionDisplayState({ id: 'bear-sitting' }, null)).toBe('sit');
		expect(getCompanionDisplayState({ id: 'bear-sleeping' }, undefined)).toBe('sleep');
	});
});
