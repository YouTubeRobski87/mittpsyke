import { describe, expect, it } from 'vitest';
import {
	clearReflectionSavedTimestamp,
	getReflectionSavedTimestamp,
	recordSuccessfulReflectionSave
} from './diary-events';

// Testsviten körs i Node, utan jsdom/happy-dom (inget sådant paket finns i
// projektet - se package.json), så `window` finns inte här. Det här testar
// därför inte lagringens läs/skriv-varv (det kräver en riktig DOM-miljö),
// utan bara SSR-kontraktet: att modulen aldrig kastar eller läcker ett
// `window`-beroende fel när den körs på servern. Samma klass av bugg fixades
// nyligen i HealthConsent.svelte (onDestroy körde `document`-kod under SSR),
// så det är ett verkligt, inte hypotetiskt, regressionsskydd.
describe('reflection-saved timestamp (SSR-kontrakt, utan window)', () => {
	it('never throws when recording without a window', () => {
		expect(() => recordSuccessfulReflectionSave()).not.toThrow();
	});

	it('reads as null when there is no window', () => {
		expect(getReflectionSavedTimestamp()).toBeNull();
	});

	it('never throws when clearing without a window', () => {
		expect(() => clearReflectionSavedTimestamp()).not.toThrow();
	});
});
