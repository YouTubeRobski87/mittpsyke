/**
 * Upptäcker om det virtuella tangentbordet är uppe, och exponerar det som
 * `data-keyboard-open` samt `--keyboard-inset` på <html>.
 *
 * Varför det behövs trots `interactive-widget=resizes-content` i app.html:
 * meta-taggen får layouten att krympa till rätt höjd, vilket löser själva
 * utrymmesfördelningen. Men CSS kan inte skilja "kort skärm" från "tangentbord
 * uppe" - och det är just den skillnaden som avgör om röstpanelen ska visas i
 * sitt fulla format eller kompakt. Höjden ensam räcker inte som signal.
 *
 * VisualViewport finns i alla webbläsare vi bryr oss om här, och krymper både
 * på Android Chrome (med resizes-content) och på iOS Safari (som ignorerar
 * interactive-widget men ändå krymper den visuella viewporten). Samma
 * detektion fungerar därför på båda.
 */

/**
 * Under så här många pixlar räknas höjdminskningen som något annat än ett
 * tangentbord - adressfält som fälls ihop vid skroll ligger runt 50-60 px.
 */
const KEYBOARD_MIN_INSET = 120;

export type KeyboardViewportState = {
	open: boolean;
	inset: number;
};

/** Räknar ut tillståndet ur en uppmätt höjd och den största höjd vi sett. */
export function getKeyboardViewportState(
	currentHeight: number,
	baselineHeight: number
): KeyboardViewportState {
	if (!Number.isFinite(currentHeight) || !Number.isFinite(baselineHeight)) {
		return { open: false, inset: 0 };
	}

	const inset = Math.max(0, baselineHeight - currentHeight);
	return inset >= KEYBOARD_MIN_INSET ? { open: true, inset } : { open: false, inset: 0 };
}

/**
 * Startar bevakningen. Returnerar en städfunktion som tar bort både lyssnare
 * och attribut, så vyer som inte längre är monterade inte lämnar kvar ett
 * `data-keyboard-open` som resten av appen tror på.
 */
export function observeKeyboardViewport(): () => void {
	if (typeof window === 'undefined') return () => {};

	const viewport = window.visualViewport;
	const root = document.documentElement;
	if (!viewport) return () => {};

	// Den största höjd vi sett i nuvarande orientering är "utan tangentbord".
	// Att jämföra mot innerHeight duger inte: med resizes-content krymper även
	// den när tangentbordet öppnas.
	let baselineHeight = viewport.height;

	const apply = () => {
		baselineHeight = Math.max(baselineHeight, viewport.height);
		const { open, inset } = getKeyboardViewportState(viewport.height, baselineHeight);
		root.dataset.keyboardOpen = open ? 'true' : 'false';
		root.style.setProperty('--keyboard-inset', `${inset}px`);
	};

	// Rotation ger en helt ny bashöjd; utan omstart skulle liggande läge se ut
	// som ett permanent öppet tangentbord.
	const resetBaseline = () => {
		baselineHeight = viewport.height;
		apply();
	};

	apply();
	viewport.addEventListener('resize', apply);
	window.addEventListener('orientationchange', resetBaseline);

	return () => {
		viewport.removeEventListener('resize', apply);
		window.removeEventListener('orientationchange', resetBaseline);
		delete root.dataset.keyboardOpen;
		root.style.removeProperty('--keyboard-inset');
	};
}
