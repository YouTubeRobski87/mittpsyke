/** Programmatisk scroll som respekterar anvandarens rorelsepreferens. */
export function scrollIntoViewWithMotionPreference(
	element: Element,
	options: Omit<ScrollIntoViewOptions, 'behavior'> = {}
) {
	const reducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	element.scrollIntoView({
		...options,
		behavior: reducedMotion ? 'auto' : 'smooth'
	});
}
