import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
	buildWorldPresence,
	getEligibleWorldMarkIds,
	getWorldStage,
	type WorldMarkId,
	type WorldStage
} from '$lib/world/worldStage';
import type { PageLoad } from './$types';

// QA-harness för världens progression. Framsteg ligger bakom inloggning och
// ett riktigt kontos historik går inte att välja, så den här sidan monterar
// den riktiga Framsteg-komponenten med ett syntetiskt konto per stadium.
// Samma komponent, samma CSS och samma scen - bara underlaget skiljer.
//
// Den finns bara i utvecklingsläge: i ett produktionsbygge är `dev` falskt och
// sidan svarar 404 innan något renderas. Ingen serverrendering, så allt räknas
// mot webbläsarens klocka (som QA-skriptet låser).
export const ssr = false;

/** Fast QA-tid. Skriptet låser webbläsarens klocka till samma ögonblick. */
const QA_NOW = '2026-07-10T13:10:00+02:00';

type Fixture = {
	label: string;
	/** Dagar före QA_NOW då ett inlägg sparades. */
	entryDaysAgo: number[];
	reflectionCount: number;
	accountAgeDays: number;
};

function range(count: number, everyDays: number, offset = 0): number[] {
	return Array.from({ length: count }, (_, index) => offset + Math.round(index * everyDays));
}

// Typiska konton som precis når varje stadium, plus ett gammalt konto med lite
// historik (vanligt bland tidiga användare) och ett långt, aktivt år.
const FIXTURES: Record<string, Fixture> = {
	'0': { label: 'Stadium 0 - inget skrivet', entryDaysAgo: [], reflectionCount: 0, accountAgeDays: 0 },
	'1': { label: 'Stadium 1 - ett inlägg', entryDaysAgo: [0], reflectionCount: 0, accountAgeDays: 0 },
	'2': { label: 'Stadium 2 - tre dagar', entryDaysAgo: [0, 1, 2], reflectionCount: 0, accountAgeDays: 3 },
	'3': { label: 'Stadium 3 - två veckor', entryDaysAgo: range(7, 2), reflectionCount: 1, accountAgeDays: 14 },
	'4': { label: 'Stadium 4 - en månad', entryDaysAgo: range(10, 3), reflectionCount: 3, accountAgeDays: 30 },
	'5': { label: 'Stadium 5 - ett år', entryDaysAgo: range(150, 2.4), reflectionCount: 40, accountAgeDays: 365 },
	gammalt: {
		label: 'Gammalt konto, 150 dagar, två inlägg',
		entryDaysAgo: [40, 110],
		reflectionCount: 0,
		accountAgeDays: 150
	}
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(date: Date): string {
	return new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Europe/Stockholm',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date);
}

export const load: PageLoad = ({ url }) => {
	if (!dev) throw error(404, 'Not found');

	const key = url.searchParams.get('fixture') ?? '0';
	const fixture = FIXTURES[key];
	if (!fixture) throw error(404, 'Okänd fixture');

	const now = new Date(QA_NOW);
	const diaryActivityDays: Record<string, number> = {};
	for (const daysAgo of fixture.entryDaysAgo) {
		diaryActivityDays[dateKey(new Date(now.getTime() - daysAgo * DAY_MS))] = 1;
	}
	const entryCount = fixture.entryDaysAgo.length;
	const accountCreatedAt = new Date(now.getTime() - fixture.accountAgeDays * DAY_MS).toISOString();
	const presence = buildWorldPresence({
		activityDays: diaryActivityDays,
		entryCount,
		reflectionCount: fixture.reflectionCount,
		accountCreatedAt,
		now
	});
	const worldProgress: { marks: WorldMarkId[]; stage: WorldStage } = {
		marks: getEligibleWorldMarkIds(presence),
		stage: getWorldStage(presence)
	};

	return {
		fixtureKey: key,
		fixtureLabel: fixture.label,
		fixtureKeys: Object.keys(FIXTURES),
		presence,
		progress: {
			isAnonymous: false,
			initialSceneSpotId: undefined,
			initialSceneBand: undefined,
			accountCreatedAt,
			streak: null,
			milestones: null,
			weeklyEntries: 0,
			entryCount,
			activeDays: presence.activeDays,
			growthScore: 0,
			growthLevel: 0,
			heatmapData: {},
			heatmapError: '',
			profileTheme: null,
			companionRelationshipStage: 0 as const,
			companionDaily: { answeredDayCount: fixture.reflectionCount },
			diaryActivityDays,
			worldProgress
		}
	};
};
