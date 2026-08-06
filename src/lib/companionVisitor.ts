export type CompanionVisitorId = 'fox' | 'bear';

export type CompanionVisitorState = {
	visitorId: CompanionVisitorId | null;
	startedAt: number | null;
	endsAt: number | null;
	nextEligibleAt: number;
};

export type CompanionVisitorContext = {
	mainCompanionId: string;
	isSleeping: boolean;
	sceneAllowsVisitor: boolean;
};

export const COMPANION_VISITOR_MIN_DURATION_MS = 20 * 60 * 1000;
export const COMPANION_VISITOR_MAX_DURATION_MS = 40 * 60 * 1000;
export const COMPANION_VISITOR_MIN_PAUSE_MS = 3 * 60 * 60 * 1000;
export const COMPANION_VISITOR_RECHECK_MS = 60 * 60 * 1000;
export const COMPANION_VISITOR_MIN_SCENE_WIDTH_PX = 641;

const COMPANION_VISITOR_CHANCE = 0.3;
const STORAGE_KEY = 'mittpsyke:companion-visitor:v1';

const EMPTY_STATE: CompanionVisitorState = {
	visitorId: null,
	startedAt: null,
	endsAt: null,
	nextEligibleAt: 0
};

const VISITOR_ASSETS: Record<CompanionVisitorId, string> = {
	fox: '/images/avatars/presets/fox-realistic-resting-sitting.png',
	bear: '/images/avatars/presets/bear-sitting.png'
};

function isVisitorId(value: unknown): value is CompanionVisitorId {
	return value === 'fox' || value === 'bear';
}

function parseState(value: string | null): CompanionVisitorState {
	if (!value) return { ...EMPTY_STATE };

	try {
		const parsed = JSON.parse(value) as Partial<CompanionVisitorState>;
		if (
			(parsed.visitorId !== null && !isVisitorId(parsed.visitorId)) ||
			(parsed.startedAt !== null && typeof parsed.startedAt !== 'number') ||
			(parsed.endsAt !== null && typeof parsed.endsAt !== 'number') ||
			typeof parsed.nextEligibleAt !== 'number'
		) {
			return { ...EMPTY_STATE };
		}

		return {
			visitorId: parsed.visitorId ?? null,
			startedAt: parsed.startedAt ?? null,
			endsAt: parsed.endsAt ?? null,
			nextEligibleAt: parsed.nextEligibleAt
		};
	} catch {
		return { ...EMPTY_STATE };
	}
}

function persistState(storage: Storage | null, state: CompanionVisitorState): CompanionVisitorState {
	if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state));
	return state;
}

function getVisitorFor(mainCompanionId: string): CompanionVisitorId | null {
	if (mainCompanionId === 'fox') return 'bear';
	if (mainCompanionId === 'bear') return 'fox';
	return null;
}

function getVisitDuration(random: () => number): number {
	return (
		COMPANION_VISITOR_MIN_DURATION_MS +
		Math.floor(random() * (COMPANION_VISITOR_MAX_DURATION_MS - COMPANION_VISITOR_MIN_DURATION_MS + 1))
	);
}

/**
 * Läser eller uppdaterar en kort, lokal besöksperiod. Tillståndet är helt
 * separat från användarens val av huvudföljeslagare och från posesystemet.
 */
export function getCompanionVisitorState(
	context: CompanionVisitorContext,
	now = Date.now(),
	storage: Storage | null = null,
	random: () => number = Math.random
): CompanionVisitorState {
	const stored = parseState(storage?.getItem(STORAGE_KEY) ?? null);
	const eligibleVisitor = getVisitorFor(context.mainCompanionId);

	// Sömn och olämpliga scener döljer besökaren men rör inte en pågående period.
	// När användaren går tillbaka till en lämplig scen ligger samma besök kvar.
	if (!eligibleVisitor || context.isSleeping || !context.sceneAllowsVisitor) {
		return { ...stored, visitorId: null, startedAt: null, endsAt: null };
	}

	// Om användaren har bytt huvudföljeslagare får det tidigare besöket aldrig
	// göra den nyvalda huvudfiguren till sin egen besökare.
	if (stored.visitorId === context.mainCompanionId) {
		return persistState(storage, {
			visitorId: null,
			startedAt: null,
			endsAt: null,
			nextEligibleAt: Math.max(stored.nextEligibleAt, now + COMPANION_VISITOR_MIN_PAUSE_MS)
		});
	}

	if (
		stored.visitorId &&
		stored.visitorId !== context.mainCompanionId &&
		stored.endsAt !== null &&
		stored.endsAt > now
	) {
		return stored;
	}

	if (stored.visitorId && (stored.endsAt === null || stored.endsAt <= now)) {
		return persistState(storage, {
			visitorId: null,
			startedAt: null,
			endsAt: null,
			nextEligibleAt: Math.max(stored.nextEligibleAt, now + COMPANION_VISITOR_MIN_PAUSE_MS)
		});
	}

	if (stored.nextEligibleAt > now) return stored;

	if (random() >= COMPANION_VISITOR_CHANCE) {
		return persistState(storage, {
			...EMPTY_STATE,
			nextEligibleAt: now + COMPANION_VISITOR_RECHECK_MS
		});
	}

	const duration = getVisitDuration(random);
	return persistState(storage, {
		visitorId: eligibleVisitor,
		startedAt: now,
		endsAt: now + duration,
		nextEligibleAt: now + duration + COMPANION_VISITOR_MIN_PAUSE_MS
	});
}

/** Stilla, dokumenterade fallback-assets. Ett okänt djur returnerar null. */
export function getCompanionVisitorAsset(visitorId: string | null): string | null {
	return visitorId && isVisitorId(visitorId) ? VISITOR_ASSETS[visitorId] : null;
}

export function getCompanionVisitorPosition(scene: 'dashboard' | 'progress') {
	return scene === 'dashboard'
		? { x: 41, y: 82, zIndex: 2 }
		: { x: 35, y: 74, zIndex: 2 };
}

export function canShowCompanionVisitorAtViewport(viewportWidth: number): boolean {
	return viewportWidth >= COMPANION_VISITOR_MIN_SCENE_WIDTH_PX;
}
