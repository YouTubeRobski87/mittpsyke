import { describe, expect, it } from 'vitest';
import {
	COMPANION_BOND_PER_ANSWER,
	getCompanionBond,
	getCompanionBondLevel
} from './companionBond';
import {
	GROWTH_POINTS_PER_COMPANION_REFLECTION,
	getGardenGrowthPoints,
	getGrowthLevel
} from './worldScene';

describe('getCompanionBond', () => {
	it('ökar med ett steg per besvarad dag', () => {
		expect(getCompanionBond(0)).toBe(0);
		expect(getCompanionBond(1)).toBe(COMPANION_BOND_PER_ANSWER);
		expect(getCompanionBond(4)).toBe(4 * COMPANION_BOND_PER_ANSWER);
	});

	it('ger aldrig minus - varken av frånvaro eller av trasig indata', () => {
		expect(getCompanionBond(-5)).toBe(0);
		expect(getCompanionBond(Number.NaN)).toBe(0);
		expect(getCompanionBond(null)).toBe(0);
		expect(getCompanionBond(undefined)).toBe(0);
		expect(getCompanionBond('3')).toBe(0);
	});

	it('är oberoende av när svaren gavs - en missad dag kostar ingenting', () => {
		// Samma antal besvarade dagar ger samma band, oavsett uppehåll emellan.
		const beforeBreak = getCompanionBond(6);
		const afterLongAbsence = getCompanionBond(6);
		expect(afterLongAbsence).toBe(beforeBreak);
		// Nästa svar efter uppehållet fortsätter uppåt från samma nivå.
		expect(getCompanionBond(7)).toBeGreaterThan(beforeBreak);
	});

	it('är monotont växande', () => {
		let previous = -1;
		for (let answeredDays = 0; answeredDays <= 40; answeredDays += 1) {
			const bond = getCompanionBond(answeredDays);
			expect(bond).toBeGreaterThan(previous);
			previous = bond;
		}
	});
});

describe('getCompanionBondLevel', () => {
	it('härleder nivåer 0-3 ur bandet', () => {
		expect(getCompanionBondLevel(0)).toBe(0);
		expect(getCompanionBondLevel(2)).toBe(0);
		expect(getCompanionBondLevel(3)).toBe(1);
		expect(getCompanionBondLevel(9)).toBe(1);
		expect(getCompanionBondLevel(10)).toBe(2);
		expect(getCompanionBondLevel(24)).toBe(2);
		expect(getCompanionBondLevel(25)).toBe(3);
		expect(getCompanionBondLevel(1000)).toBe(3);
	});

	it('faller tillbaka till nivå 0 för trasiga värden', () => {
		expect(getCompanionBondLevel(-4)).toBe(0);
		expect(getCompanionBondLevel(Number.NaN)).toBe(0);
		expect(getCompanionBondLevel(undefined)).toBe(0);
	});
});

describe('getGardenGrowthPoints', () => {
	it('låter ett svar väga ett halvt steg mot en dagboksanteckning', () => {
		expect(getGardenGrowthPoints(0, 0)).toBe(0);
		expect(getGardenGrowthPoints(0, 1)).toBe(GROWTH_POINTS_PER_COMPANION_REFLECTION);
		expect(getGardenGrowthPoints(4, 2)).toBe(5);
	});

	it('ger trädgården progression av ett svar, men aldrig av hoppa över', () => {
		// Hoppa över ökar inte antalet besvarade dagar - underlaget står stilla.
		const beforeAnswer = getGardenGrowthPoints(5, 1);
		const afterSkip = getGardenGrowthPoints(5, 1);
		const afterAnswer = getGardenGrowthPoints(5, 2);
		expect(afterSkip).toBe(beforeAnswer);
		expect(afterAnswer).toBeGreaterThan(beforeAnswer);
	});

	it('kan lyfta trädgården till nästa växtnivå', () => {
		// 5 anteckningar ligger strax under nivå 2 (tröskeln är 6).
		expect(getGrowthLevel(getGardenGrowthPoints(5, 0))).toBe(1);
		expect(getGrowthLevel(getGardenGrowthPoints(5, 2))).toBe(2);
	});

	it('sänker aldrig underlaget vid frånvaro eller trasig indata', () => {
		expect(getGardenGrowthPoints(-3, -8)).toBe(0);
		expect(getGardenGrowthPoints(Number.NaN, Number.NaN)).toBe(0);
		expect(getGardenGrowthPoints(7, undefined)).toBe(7);
		expect(getGardenGrowthPoints(7)).toBe(7);
	});

	it('lämnar den befintliga trädgårdsmodellen oförändrad utan reflektioner', () => {
		for (const entries of [0, 1, 5, 6, 15, 16, 30, 31, 90]) {
			expect(getGrowthLevel(getGardenGrowthPoints(entries, 0))).toBe(getGrowthLevel(entries));
		}
	});
});
