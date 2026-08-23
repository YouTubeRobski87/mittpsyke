import { describe, expect, it } from 'vitest';
import { getEveningLampCssVariables, getEveningLampStyle } from './evening-lamp';

describe('Kvällsstugans lampsken', () => {
	it('är diskret före kvällen och tydligare när natten kommer', () => {
		const day = getEveningLampStyle('day');
		const evening = getEveningLampStyle('evening');
		const night = getEveningLampStyle('night');

		expect(day.glowOpacity).toBeLessThan(evening.glowOpacity);
		expect(evening.glowOpacity).toBeLessThan(night.glowOpacity);
		expect(day.idleOpacity).toBeLessThan(night.idleOpacity);
	});

	it('skriver bara CSS-variabler för den befintliga lampan', () => {
		expect(getEveningLampCssVariables('evening')).toBe(
			'--cabin-lamp-idle-opacity: 0.72; --cabin-lamp-peak-opacity: 0.8; --cabin-lamp-low-opacity: 0.68; --cabin-lamp-glow-opacity: 0.2'
		);
	});
});
