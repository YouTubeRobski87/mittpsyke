import { describe, expect, it } from 'vitest';
import { getKeyboardViewportState } from './keyboardViewport';

/**
 * Tröskeln är det som skiljer ett tangentbord från allt annat som krymper den
 * visuella viewporten. Android Chromes adressfält fälls ihop med runt 50-60 px
 * när man skrollar; skulle det räknas som tangentbord hade röstpanelen hoppat
 * mellan kompakt och fullt format mitt i en skrollning.
 */
describe('getKeyboardViewportState', () => {
	it('räknar ingen minskning alls som stängt tangentbord', () => {
		expect(getKeyboardViewportState(800, 800)).toEqual({ open: false, inset: 0 });
	});

	it('räknar ett hopfällt adressfält som stängt', () => {
		expect(getKeyboardViewportState(744, 800)).toEqual({ open: false, inset: 0 });
	});

	it('räknar en tangentbordsstor minskning som öppet och rapporterar höjden', () => {
		expect(getKeyboardViewportState(475, 800)).toEqual({ open: true, inset: 325 });
	});

	it('är öppet exakt på tröskeln', () => {
		expect(getKeyboardViewportState(680, 800).open).toBe(true);
		expect(getKeyboardViewportState(681, 800).open).toBe(false);
	});

	it('ger aldrig ett negativt inset när viewporten växer förbi baslinjen', () => {
		const state = getKeyboardViewportState(900, 800);
		expect(state.inset).toBe(0);
		expect(state.open).toBe(false);
	});

	it('faller tillbaka på stängt när en höjd inte går att läsa', () => {
		expect(getKeyboardViewportState(Number.NaN, 800)).toEqual({ open: false, inset: 0 });
		expect(getKeyboardViewportState(475, Number.NaN)).toEqual({ open: false, inset: 0 });
	});
});
