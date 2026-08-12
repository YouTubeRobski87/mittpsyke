import { describe, expect, it } from 'vitest';
import { getBaseCompanionState, getCompanionDisplayState } from './companionStateMachine';

describe('getBaseCompanionState', () => {
	it('maps fox base poses to the canonical vocabulary', () => {
		expect(getBaseCompanionState({ id: 'idle' })).toBe('idle');
		expect(getBaseCompanionState({ id: 'look-left' })).toBe('look-left');
		expect(getBaseCompanionState({ id: 'look-right' })).toBe('look-right');
		expect(getBaseCompanionState({ id: 'sit' })).toBe('sit');
		expect(getBaseCompanionState({ id: 'sit-look-up' })).toBe('sit');
		expect(getBaseCompanionState({ id: 'evening-lake' })).toBe('sit');
		expect(getBaseCompanionState({ id: 'sniff' })).toBe('sniff');
		expect(getBaseCompanionState({ id: 'drink' })).toBe('sniff');
		expect(getBaseCompanionState({ id: 'walk' })).toBe('walk');
		expect(getBaseCompanionState({ id: 'rest' })).toBe('rest');
		expect(getBaseCompanionState({ id: 'sleep-curled' })).toBe('sleep');
		expect(getBaseCompanionState({ id: 'sleep-side' })).toBe('sleep');
	});

	it('only reports states that bear and wolf actually have art for', () => {
		expect(getBaseCompanionState({ id: 'bear-standing' })).toBe('idle');
		expect(getBaseCompanionState({ id: 'bear-sitting' })).toBe('sit');
		expect(getBaseCompanionState({ id: 'bear-sleeping' })).toBe('sleep');
		expect(getBaseCompanionState({ id: 'bear-stretching' })).toBe('idle');
		expect(getBaseCompanionState({ id: 'wolf-standing' })).toBe('idle');
		expect(getBaseCompanionState({ id: 'wolf-sleeping' })).toBe('sleep');
	});

	it('falls back to idle for missing or unknown poses', () => {
		expect(getBaseCompanionState(null)).toBe('idle');
		expect(getBaseCompanionState(undefined)).toBe('idle');
		expect(getBaseCompanionState({ id: 'some-future-pose-id' })).toBe('idle');
	});
});

describe('getCompanionDisplayState', () => {
	it('reports "blink" whenever a blink overlay is active, regardless of base pose', () => {
		expect(getCompanionDisplayState({ id: 'sit' }, { motion: 'blink' })).toBe('blink');
		expect(getCompanionDisplayState({ id: 'walk' }, { motion: 'blink' })).toBe('blink');
	});

	it('ignores non-blink overlays and falls back to the base state', () => {
		expect(getCompanionDisplayState({ id: 'sit' }, { motion: 'gesture' })).toBe('sit');
		expect(getCompanionDisplayState({ id: 'sleep-curled' }, { motion: 'sleep' })).toBe('sleep');
	});

	it('falls back to the base state when there is no overlay', () => {
		expect(getCompanionDisplayState({ id: 'walk' }, null)).toBe('walk');
		expect(getCompanionDisplayState({ id: 'walk' }, undefined)).toBe('walk');
	});
});
