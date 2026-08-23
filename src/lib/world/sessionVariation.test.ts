import { describe, expect, it } from 'vitest';
import { getCloudSessionVariation, getLeafSessionCharacter } from './sessionVariation';

describe('sessionvariation för den levande världen', () => {
	it('ger samma molnvariation för samma sessionsseed och lager', () => {
		const input = { durationMs: 96_000, delayMs: -18_000 };
		expect(getCloudSessionVariation('session-a', 'cloud-back', input)).toEqual(
			getCloudSessionVariation('session-a', 'cloud-back', input)
		);
	});

	it('kan ge en annan, men fortsatt lågmäld, molnvariation för en ny session', () => {
		const input = { durationMs: 96_000, delayMs: -18_000 };
		const first = getCloudSessionVariation('session-a', 'cloud-back', input);
		const next = getCloudSessionVariation('session-b', 'cloud-back', input);

		expect(next).not.toEqual(first);
		expect(first.offsetX).toBeGreaterThanOrEqual(-3.5);
		expect(first.offsetX).toBeLessThanOrEqual(3.5);
	});

	it('ger löven samma grundkaraktär under samma session, utan att låsa enskilda löv', () => {
		const first = getLeafSessionCharacter('session-a');
		expect(first).toEqual(getLeafSessionCharacter('session-a'));
		expect(first.spawnMaxX).toBeGreaterThan(first.spawnMinX);
		expect(first.intervalFactor).toBeGreaterThanOrEqual(0.9);
		expect(first.intervalFactor).toBeLessThanOrEqual(1.1);
		expect(getLeafSessionCharacter('session-b')).not.toEqual(first);
	});
});
