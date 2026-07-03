import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DEFAULT_THEME, THEMES } from '$lib/theme';
import { readProgressCompanionFromMetadata } from '$lib/progressCompanion';

type DiaryRow = {
	id: string;
	text: string | null;
	created_at: string | null;
};

type PortalDiaryPreview = {
	id: string | null;
	snippet: string;
	dateLabel: string;
	hasEntry: boolean;
};

type PortalProgressPreview = {
	currentStreak: number;
	weeklyEntries: number;
	totalEntries: number;
	summary: string;
};

type PortalSettingsPreview = {
	displayName: string | null;
	themeLabel: string;
	weeklyGoalLabel: string;
	dashboardFocusLabel: string;
};

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
const DAY_MS = 24 * 60 * 60 * 1000;
const dateLabelFormatter = new Intl.DateTimeFormat('sv-SE', {
	timeZone: STOCKHOLM_TIME_ZONE,
	day: 'numeric',
	month: 'long'
});
const stockholmDateFormatter = new Intl.DateTimeFormat('sv-CA', {
	timeZone: STOCKHOLM_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

const WEEKLY_GOAL_LABELS: Record<string, string> = {
	diary_3_week: 'Skriva i dagboken 3 gånger i veckan',
	mood_daily: 'Checka in mitt humör varje dag',
	write_when_needed: 'Skriva när tankarna blir mycket',
	calm_moments: 'Skapa en lugn stund några gånger i veckan',
	none: 'Ingen vald rytm just nu'
};

const DASHBOARD_WIDGET_LABELS: Record<string, string> = {
	dagbok: 'Dagboken',
	mood: 'Senaste humör',
	guide: 'Guider',
	chat: 'Chatten'
};

function isMissingTableError(
	error: { code?: string | null; message?: string | null } | null | undefined,
	tableName: string
) {
	if (!error) return false;
	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		(error.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
}

function cleanName(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed || trimmed.includes('@')) return null;
	return trimmed;
}

function toSnippet(value: string | null | undefined, maxLength = 140) {
	if (!value) return '';
	const normalized = value.replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLength) return normalized;
	return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function formatDateLabel(value: string | null) {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return dateLabelFormatter.format(date);
}

function toStockholmDateKey(value: string) {
	return stockholmDateFormatter.format(new Date(value));
}

function stockholmTodayKey() {
	return stockholmDateFormatter.format(new Date());
}

function dateKeyToUtcMs(dateKey: string) {
	const [year, month, day] = dateKey.split('-').map(Number);
	return Date.UTC(year, month - 1, day);
}

function startOfWeekIso() {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	const monday = new Date(now);
	monday.setDate(now.getDate() + mondayOffset);
	monday.setHours(0, 0, 0, 0);
	return monday.toISOString();
}

function buildProgressSummary(currentStreak: number, weeklyEntries: number, totalEntries: number) {
	if (currentStreak >= 7) {
		return `${currentStreak} dagar nära i tid. Du har hittat en rytm som verkar fungera just nu.`;
	}
	if (currentStreak >= 3) {
		return `${currentStreak} dagar nära i tid och ${weeklyEntries} inlägg den här veckan.`;
	}
	if (weeklyEntries >= 3) {
		return `${weeklyEntries} inlägg den här veckan. Du håller kontakt med dig själv.`;
	}
	if (totalEntries >= 1) {
		return `${totalEntries} sparade anteckningar finns kvar att gå tillbaka till.`;
	}
	return 'Små steg räcker. Ditt första inlägg kan börja här.';
}

function buildCurrentStreak(entries: { created_at: string | null }[]) {
	const entryDates = entries
		.map((entry) => (entry.created_at ? toStockholmDateKey(entry.created_at) : null))
		.filter((value, index, self): value is string => Boolean(value) && self.indexOf(value) === index);

	if (entryDates.length === 0) return 0;

	const todayUtcMs = dateKeyToUtcMs(stockholmTodayKey());
	let currentStreak = 0;
	let checkDateUtcMs = todayUtcMs;

	for (const entryDate of entryDates) {
		const dateUtcMs = dateKeyToUtcMs(entryDate);
		if (checkDateUtcMs === dateUtcMs) {
			currentStreak += 1;
			checkDateUtcMs -= DAY_MS;
			continue;
		}

		if (currentStreak === 0 && checkDateUtcMs - DAY_MS === dateUtcMs) {
			currentStreak += 1;
			checkDateUtcMs = dateUtcMs - DAY_MS;
			continue;
		}

		break;
	}

	return currentStreak;
}

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	const weeklyStart = startOfWeekIso();
	const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
	const themeKey =
		typeof metadata.profile_theme === 'string' && metadata.profile_theme in THEMES
			? metadata.profile_theme
			: DEFAULT_THEME;
	const themeLabel = THEMES[themeKey]?.label ?? THEMES[DEFAULT_THEME].label;

	const [latestDiaryEntryResult, streakEntriesResult, totalEntriesResult, weeklyEntriesResult] =
		await Promise.all([
			locals.supabase
				.from('diary')
				.select('id, text, created_at')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle<DiaryRow>(),
			locals.supabase
				.from('diary')
				.select('created_at')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })
				.limit(120),
			locals.supabase.from('diary').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
			locals.supabase
				.from('diary')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', user.id)
				.gte('created_at', weeklyStart)
		]);

	if (latestDiaryEntryResult.error && !isMissingTableError(latestDiaryEntryResult.error, 'diary')) {
		console.error('Dashboard latest diary load error:', latestDiaryEntryResult.error);
	}
	if (streakEntriesResult.error && !isMissingTableError(streakEntriesResult.error, 'diary')) {
		console.error('Dashboard streak load error:', streakEntriesResult.error);
	}
	if (totalEntriesResult.error && !isMissingTableError(totalEntriesResult.error, 'diary')) {
		console.error('Dashboard total entries load error:', totalEntriesResult.error);
	}
	if (weeklyEntriesResult.error && !isMissingTableError(weeklyEntriesResult.error, 'diary')) {
		console.error('Dashboard weekly entries load error:', weeklyEntriesResult.error);
	}

	const latestDiaryEntry = latestDiaryEntryResult.data ?? null;
	const streakEntries = streakEntriesResult.data ?? [];
	const totalEntries = totalEntriesResult.count ?? 0;
	const weeklyEntries = weeklyEntriesResult.count ?? 0;
	const currentStreak = buildCurrentStreak(streakEntries);

	const diaryPreview: PortalDiaryPreview = latestDiaryEntry
		? {
				id: latestDiaryEntry.id,
				snippet: toSnippet(latestDiaryEntry.text, 150),
				dateLabel: formatDateLabel(latestDiaryEntry.created_at),
				hasEntry: true
			}
		: {
				id: null,
				snippet: 'Din dagbok väntar stilla. Du kan fortsätta där du var eller börja med några enkla ord.',
				dateLabel: '',
				hasEntry: false
			};

	const progressPreview: PortalProgressPreview = {
		currentStreak,
		weeklyEntries,
		totalEntries,
		summary: buildProgressSummary(currentStreak, weeklyEntries, totalEntries)
	};

	const settingsPreview: PortalSettingsPreview = {
		displayName: cleanName(metadata.display_name) ?? cleanName(metadata.full_name) ?? cleanName(metadata.name),
		themeLabel,
		weeklyGoalLabel:
			typeof metadata.weekly_goal_type === 'string'
				? (WEEKLY_GOAL_LABELS[metadata.weekly_goal_type] ?? WEEKLY_GOAL_LABELS.diary_3_week)
				: WEEKLY_GOAL_LABELS.diary_3_week,
		dashboardFocusLabel:
			typeof metadata.dashboard_widget === 'string'
				? (DASHBOARD_WIDGET_LABELS[metadata.dashboard_widget] ?? DASHBOARD_WIDGET_LABELS.dagbok)
				: DASHBOARD_WIDGET_LABELS.dagbok
	};

	return {
		title: 'Mitt rum',
		description: 'En lugn översikt över dagbok, framsteg och inställningar.',
		diaryPreview,
		progressPreview,
		settingsPreview,
		progressCompanion: readProgressCompanionFromMetadata(metadata)
	};
};
