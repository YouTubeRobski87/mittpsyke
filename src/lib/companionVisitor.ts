export type CompanionVisitorId = 'fox' | 'bear';
export type CompanionVisitorType = 'awake' | 'sleeping';

export type CompanionVisitorAssets = Record<
	CompanionVisitorType,
	Partial<Record<CompanionVisitorId, string>>
>;

export type CompanionVisitorState = {
	visitorId: CompanionVisitorId | null;
	visitorType: CompanionVisitorType | null;
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
export const COMPANION_VISITOR_SLEEP_MIN_DURATION_MS = 30 * 60 * 1000;
export const COMPANION_VISITOR_SLEEP_MAX_DURATION_MS = 90 * 60 * 1000;
export const COMPANION_VISITOR_MIN_PAUSE_MS = 3 * 60 * 60 * 1000;
export const COMPANION_VISITOR_RECHECK_MS = 60 * 60 * 1000;
export const COMPANION_VISITOR_TYPE_TRANSITION_RECHECK_MS = 30 * 60 * 1000;
export const COMPANION_VISITOR_MIN_SCENE_WIDTH_PX = 641;

const COMPANION_VISITOR_CHANCE = 0.3;
const STORAGE_KEY = 'mittpsyke:companion-visitor:v1';

const EMPTY_STATE: CompanionVisitorState = {
	visitorId: null,
	visitorType: null,
	startedAt: null,
	endsAt: null,
	nextEligibleAt: 0
};

const VISITOR_ASSETS: CompanionVisitorAssets = {
	awake: {
		fox: '/images/avatars/presets/fox-realistic-resting-sitting.png',
		bear: '/images/avatars/presets/bear-sitting.png'
	},
	sleeping: {
		fox: '/images/avatars/presets/fox-realistic-sleeping-curled.png',
		bear: '/images/avatars/presets/bear-sleeping.png'
	}
};

function isVisitorId(value: unknown): value is CompanionVisitorId {
	return value === 'fox' || value === 'bear';
}

function isVisitorType(value: unknown): value is CompanionVisitorType {
	return value === 'awake' || value === 'sleeping';
}

function parseState(value: string | null): CompanionVisitorState {
	if (!value) return { ...EMPTY_STATE };

	try {
		const parsed = JSON.parse(value) as Partial<CompanionVisitorState>;
		const visitorId = parsed.visitorId ?? null;
		// Version 1 hade inga besökstyper. Ett befintligt besök behåller därför
		// sitt ursprungliga, vakna beteende vid uppgraderingen.
		const visitorType = parsed.visitorType ?? (visitorId ? 'awake' : null);
		if (
			(visitorId !== null && !isVisitorId(visitorId)) ||
			(visitorType !== null && !isVisitorType(visitorType)) ||
			(Boolean(visitorId) !== Boolean(visitorType)) ||
			(parsed.startedAt !== null && typeof parsed.startedAt !== 'number') ||
			(parsed.endsAt !== null && typeof parsed.endsAt !== 'number') ||
			typeof parsed.nextEligibleAt !== 'number'
		) {
			return { ...EMPTY_STATE };
		}

		return {
			visitorId,
			visitorType,
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

function getVisitDuration(visitorType: CompanionVisitorType, random: () => number): number {
	const [minimum, maximum] =
		visitorType === 'sleeping'
			? [COMPANION_VISITOR_SLEEP_MIN_DURATION_MS, COMPANION_VISITOR_SLEEP_MAX_DURATION_MS]
			: [COMPANION_VISITOR_MIN_DURATION_MS, COMPANION_VISITOR_MAX_DURATION_MS];
	return minimum + Math.floor(random() * (maximum - minimum + 1));
}

/**
 * Läser eller uppdaterar en kort, lokal besöksperiod. Tillståndet är helt
 * separat från användarens val av huvudföljeslagare och från posesystemet.
 */
export function getCompanionVisitorState(
	context: CompanionVisitorContext,
	now = Date.now(),
	storage: Storage | null = null,
	random: () => number = Math.random,
	assets: CompanionVisitorAssets = VISITOR_ASSETS
): CompanionVisitorState {
	const stored = parseState(storage?.getItem(STORAGE_KEY) ?? null);
	const eligibleVisitor = getVisitorFor(context.mainCompanionId);
	const requestedType: CompanionVisitorType = context.isSleeping ? 'sleeping' : 'awake';

	// En trång eller i övrigt olämplig scen döljer besökaren utan att röra
	// den stabila perioden. Sömn är däremot en egen besökstyp, inte en spärr.
	if (!eligibleVisitor || !context.sceneAllowsVisitor) {
		return { ...stored, visitorId: null, visitorType: null, startedAt: null, endsAt: null };
	}

	// Om användaren har bytt huvudföljeslagare får det tidigare besöket aldrig
	// göra den nyvalda huvudfiguren till sin egen besökare.
	if (stored.visitorId === context.mainCompanionId) {
		return persistState(storage, {
			visitorId: null,
			visitorType: null,
			startedAt: null,
			endsAt: null,
			nextEligibleAt: Math.max(stored.nextEligibleAt, now + COMPANION_VISITOR_MIN_PAUSE_MS)
		});
	}

	if (stored.visitorId && stored.visitorType) {
		const storedAsset = getCompanionVisitorAsset(stored.visitorId, stored.visitorType, assets);
		if (!storedAsset || stored.endsAt === null || stored.endsAt <= now) {
			return persistState(storage, {
				visitorId: null,
				visitorType: null,
				startedAt: null,
				endsAt: null,
				nextEligibleAt: Math.max(stored.nextEligibleAt, now + COMPANION_VISITOR_MIN_PAUSE_MS)
			});
		}

		if (stored.visitorType === requestedType) return stored;

		// Ett aktivt vaket besök avslutas när scenen blir natt (och tvärtom).
		// Nästa utvärdering sker först efter ett eget stabilt fönster, aldrig i
		// samma render som typbytet.
		return persistState(storage, {
			visitorId: null,
			visitorType: null,
			startedAt: null,
			endsAt: null,
			nextEligibleAt: Math.max(stored.nextEligibleAt, now + COMPANION_VISITOR_TYPE_TRANSITION_RECHECK_MS)
		});
	}

	if (stored.nextEligibleAt > now) return stored;
	if (!getCompanionVisitorAsset(eligibleVisitor, requestedType, assets)) {
		return persistState(storage, {
			...EMPTY_STATE,
			nextEligibleAt: now + COMPANION_VISITOR_RECHECK_MS
		});
	}

	if (random() >= COMPANION_VISITOR_CHANCE) {
		return persistState(storage, {
			...EMPTY_STATE,
			nextEligibleAt: now + COMPANION_VISITOR_RECHECK_MS
		});
	}

	const duration = getVisitDuration(requestedType, random);
	return persistState(storage, {
		visitorId: eligibleVisitor,
		visitorType: requestedType,
		startedAt: now,
		endsAt: now + duration,
		nextEligibleAt: now + duration + COMPANION_VISITOR_MIN_PAUSE_MS
	});
}

/** Returnerar aldrig en vaken pose som reserv för ett sovbesök. */
export function getCompanionVisitorAsset(
	visitorId: string | null,
	visitorType: CompanionVisitorType | null,
	assets: CompanionVisitorAssets = VISITOR_ASSETS
): string | null {
	return visitorId && visitorType && isVisitorId(visitorId) ? assets[visitorType][visitorId] ?? null : null;
}

export function getCompanionVisitorPosition(
	scene: 'dashboard' | 'progress',
	visitorType: CompanionVisitorType
) {
	if (visitorType === 'sleeping') {
		return scene === 'dashboard'
			? { x: 60, y: 81, zIndex: 2, scale: 0.88 }
			: { x: 84, y: 68, zIndex: 3, scale: 0.86 };
	}

	return scene === 'dashboard'
		? { x: 41, y: 82, zIndex: 2, scale: 1 }
		: { x: 35, y: 74, zIndex: 2, scale: 1 };
}

export function canShowCompanionVisitorAtViewport(viewportWidth: number): boolean {
	return viewportWidth >= COMPANION_VISITOR_MIN_SCENE_WIDTH_PX;
}
