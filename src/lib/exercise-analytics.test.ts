import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tools } from '$lib/data/seo-architecture';
import {
	buildExerciseEndParams,
	buildExerciseNextStepParams,
	buildExerciseOpenedParams,
	getExerciseSource,
	toExerciseId
} from './exercise-analytics';

// Mätningen av övningsdelen får bara skicka fasta värden till GA4: övningens
// slug ur den publika listan och fasta källor/mål. Aldrig fritext, svar,
// skattningar eller inloggat tillstånd.

describe('övningens id', () => {
	it('godtar varje slug i övningslistan', () => {
		for (const tool of tools) {
			expect(toExerciseId(tool.slug)).toBe(tool.slug);
		}
	});

	it('släpper aldrig igenom något utanför listan', () => {
		for (const value of ['', 'finns-inte', 'grounding-5-4-3-2-1?q=hej', '../dagbok', 'Jag mår dåligt', null, undefined]) {
			expect(toExerciseId(value)).toBeNull();
		}
		expect(buildExerciseOpenedParams('finns-inte', '/ovningar')).toBeNull();
		expect(buildExerciseEndParams('finns-inte')).toBeNull();
		expect(buildExerciseNextStepParams('finns-inte', 'overview')).toBeNull();
	});
});

describe('källan när en övning öppnas', () => {
	it.each([
		['/ovningar', 'overview'],
		['/ovningar/', 'overview'],
		['/ovningar/body-scan', 'related'],
		['/dashboard/kvallsstugan', 'evening'],
		['/guider/angest/social-angest', 'guide'],
		['/guider-seo/angest/x', 'guide'],
		['/blogg/nagot', 'guide'],
		['/dagbok', 'other'],
		['/chat/angest', 'other'],
		['/', 'other'],
		[null, 'other'],
		[undefined, 'other']
	] as const)('%s ger %s', (from, expected) => {
		expect(getExerciseSource(from)).toBe(expected);
	});
});

describe('parametrarna som skickas', () => {
	it('innehåller exakt de tillåtna nycklarna', () => {
		expect(buildExerciseOpenedParams('4-7-8-andning', '/ovningar')).toEqual({
			exercise_id: '4-7-8-andning',
			source: 'overview'
		});
		expect(buildExerciseEndParams('4-7-8-andning')).toEqual({ exercise_id: '4-7-8-andning' });
		expect(buildExerciseNextStepParams('4-7-8-andning', 'related_exercise')).toEqual({
			exercise_id: '4-7-8-andning',
			target: 'related_exercise'
		});
	});
});

describe('kopplingen i analytics.ts och på övningssidan', () => {
	const analytics = readFileSync(join(process.cwd(), 'src/lib/analytics.ts'), 'utf8');
	const page = readFileSync(join(process.cwd(), 'src/routes/ovningar/[tool]/+page.svelte'), 'utf8');

	function body(source: string, name: string) {
		const start = source.indexOf(`export function ${name}(`);
		expect(start).toBeGreaterThan(-1);
		return source.slice(start, source.indexOf('\n}\n', start));
	}

	it('skickar bara namngivna nycklar, aldrig ett helt objekt vidare', () => {
		expect(body(analytics, 'trackExerciseOpened')).toContain(
			"trackEvent('exercise_opened', { exercise_id: params.exercise_id, source: params.source })"
		);
		expect(body(analytics, 'trackExerciseReachedEnd')).toContain(
			"trackEvent('exercise_reached_end', { exercise_id: params.exercise_id })"
		);
		expect(body(analytics, 'trackExerciseNextStepClicked')).toContain(
			"trackEvent('exercise_next_step_clicked', { exercise_id: params.exercise_id, target: params.target })"
		);
	});

	it('bygger alla övningsevent via de validerande funktionerna', () => {
		const script = page.slice(0, page.indexOf('</script>'));
		for (const call of script.matchAll(/trackExercise\w+\(([^)]*)\)/g)) {
			expect(call[1]).toBe('params');
		}
		// Inget innehåll ur övningen eller kontot får hamna i mätningen.
		expect(script).not.toMatch(/trackExercise\w+\([^)]*(title|steps|reflections|purpose|session|user)/);
	});
});
