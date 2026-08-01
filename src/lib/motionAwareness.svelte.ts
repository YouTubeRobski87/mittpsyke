// Delad hook för "är fliken synlig" + "prefers-reduced-motion", så att
// animerade scenkomponenter (LivingWorld, CompanionPose) inte behöver
// duplicera samma matchMedia/visibilitychange-lyssnare var för sig.
//
// Måste anropas synkront i toppen av en komponents <script>, precis som
// $state/$derived/$effect, eftersom den registrerar en $effect internt.
export function createMotionAwareness() {
	let isActive = $state(true);
	let reducedMotion = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		const updateMotionState = () => {
			reducedMotion = motionQuery.matches;
		};
		const updateActiveState = () => {
			isActive = document.visibilityState === 'visible';
		};

		motionQuery.addEventListener('change', updateMotionState);
		document.addEventListener('visibilitychange', updateActiveState);
		updateMotionState();
		updateActiveState();

		return () => {
			motionQuery.removeEventListener('change', updateMotionState);
			document.removeEventListener('visibilitychange', updateActiveState);
		};
	});

	return {
		get isActive() {
			return isActive;
		},
		get reducedMotion() {
			return reducedMotion;
		}
	};
}
