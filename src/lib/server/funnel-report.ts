import {
	createUserRef,
	isInternalFunnelUser,
	type FunnelEventName,
	type MeaningfulActivityType
} from './funnel-events';

export type FunnelAccount = {
	id: string;
	created_at: string;
};

export type FunnelReportEvent = {
	user_ref: string;
	event_name: FunnelEventName;
	occurred_at: string;
	is_internal: boolean;
	properties?: Record<string, unknown> | null;
};

export type CoreFunnelReport = {
	status: 'ready' | 'unavailable_no_salt';
	cohort: { start: string; end: string };
	accountsCreated: number;
	activated: number;
	notActivated: number;
	w1Returned: number;
	w4Returned: number;
	firstActivity: Record<MeaningfulActivityType | 'unknown', number>;
	excludedInternalAccounts: number;
};

const EMPTY_ACTIVITY_COUNTS: Record<MeaningfulActivityType | 'unknown', number> = {
	diary: 0,
	authenticated_chat: 0,
	evening_checkin: 0,
	unknown: 0
};

function validDate(value: string) {
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inHalfOpenWindow(value: string, start: Date, end: Date) {
	const parsed = validDate(value);
	return parsed !== null && parsed.getTime() >= start.getTime() && parsed.getTime() < end.getTime();
}

function readActivityType(event: FunnelReportEvent): MeaningfulActivityType | 'unknown' {
	const value = event.properties?.activity_type;
	if (value === 'diary' || value === 'authenticated_chat' || value === 'evening_checkin') {
		return value;
	}
	return 'unknown';
}

/**
 * Bygger den minsta kärnfunnelrapporten av två serverkällor:
 * Supabase Auth-användare (kontoskapande) och product_funnel_events.
 *
 * Funktionen lagrar inget och tar aldrig emot produktinnehåll. Interna konton
 * filtreras både via den aktuella serverallowlisten och radens is_internal, så
 * äldre rader inte behöver skrivas om när ett internt id konfigureras senare.
 */
export function buildCoreFunnelReport(input: {
	accounts: readonly FunnelAccount[];
	events: readonly FunnelReportEvent[];
	cohortStart: string;
	cohortEnd: string;
}): CoreFunnelReport {
	const start = validDate(input.cohortStart);
	const end = validDate(input.cohortEnd);
	if (!start || !end || start.getTime() >= end.getTime()) {
		throw new Error('Ogiltigt kohortintervall för kärnfunneln.');
	}

	const cohortAccounts = input.accounts.filter((account) =>
		inHalfOpenWindow(account.created_at, start, end)
	);
	const configuredExternalAccounts = cohortAccounts.filter(
		(account) => !isInternalFunnelUser(account.id)
	);
	const candidateUserRefs = new Set<string>();

	for (const account of configuredExternalAccounts) {
		const userRef = createUserRef(account.id);
		if (!userRef) {
			return {
				status: 'unavailable_no_salt',
				cohort: { start: input.cohortStart, end: input.cohortEnd },
				accountsCreated: 0,
				activated: 0,
				notActivated: 0,
				w1Returned: 0,
				w4Returned: 0,
				firstActivity: { ...EMPTY_ACTIVITY_COUNTS },
				excludedInternalAccounts: cohortAccounts.length - configuredExternalAccounts.length
			};
		}
		candidateUserRefs.add(userRef);
	}

	const storedInternalRefs = new Set(
		input.events.filter((event) => event.is_internal).map((event) => event.user_ref)
	);
	const userRefs = new Set(
		[...candidateUserRefs].filter((userRef) => !storedInternalRefs.has(userRef))
	);

	const externalEvents = input.events.filter(
		(event) => userRefs.has(event.user_ref) && !event.is_internal
	);
	const activationByUser = new Map<string, FunnelReportEvent>();
	const w1Users = new Set<string>();
	const w4Users = new Set<string>();

	for (const event of externalEvents) {
		if (event.event_name === 'first_meaningful_reflection') {
			const previous = activationByUser.get(event.user_ref);
			if (!previous || event.occurred_at < previous.occurred_at) {
				activationByUser.set(event.user_ref, event);
			}
		}
		if (event.event_name === 'w1_return') w1Users.add(event.user_ref);
		if (event.event_name === 'w4_return') w4Users.add(event.user_ref);
	}

	const firstActivity = { ...EMPTY_ACTIVITY_COUNTS };
	for (const event of activationByUser.values()) {
		firstActivity[readActivityType(event)] += 1;
	}

	return {
		status: 'ready',
		cohort: { start: input.cohortStart, end: input.cohortEnd },
		accountsCreated: userRefs.size,
		activated: activationByUser.size,
		notActivated: userRefs.size - activationByUser.size,
		w1Returned: w1Users.size,
		w4Returned: w4Users.size,
		firstActivity,
		excludedInternalAccounts: cohortAccounts.length - userRefs.size
	};
}
