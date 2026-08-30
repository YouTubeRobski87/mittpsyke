import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollIntoViewWithMotionPreference } from './scroll';

describe('scrollIntoViewWithMotionPreference', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each([
		[false, 'smooth'],
		[true, 'auto']
	] as const)('anvander %s nar reduced motion ar %s', (reducedMotion, expectedBehavior) => {
		vi.stubGlobal('window', {
			matchMedia: () => ({ matches: reducedMotion })
		});
		const element = { scrollIntoView: vi.fn() } as unknown as Element;

		scrollIntoViewWithMotionPreference(element, { block: 'start' });

		expect(element.scrollIntoView).toHaveBeenCalledWith({
			block: 'start',
			behavior: expectedBehavior
		});
	});
});
