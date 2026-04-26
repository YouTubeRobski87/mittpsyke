import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DEFAULT_THEME, THEMES } from '$lib/theme';

type DiaryRow = {
	id: string;
	text: string | null;
	created_at: string | null;
};

type CommunityPostRow = {
	id: string;
	content: string | null;
	created_at: string | null;
};

type CommunityCommentRow = {
	post_id: string;
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

type PortalCommunityPreview = {
	id: string | null;
	snippet: string;
	dateLabel: string;
	replyCount: number | null;
	hasActivity: boolean;
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
	none: 'Inget mål just nu'
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
		return `${currentStreak} dagar i följd. Du har skapat en stadig rytm.`;
	}
	if (currentStreak >= 3) {
		return `${currentStreak} dagar i följd och ${weeklyEntries} inlägg den här veckan.`;
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
		data: { session }
	} = await locals.supabase.auth.getSession();
	const user = session?.user ?? null;

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

	const [
		latestDiaryEntryResult,
		streakEntriesResult,
		totalEntriesResult,
		weeklyEntriesResult,
		communityPostsResult
	] = await Promise.all([
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
		locals.supabase
			.from('diary')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id),
		locals.supabase
			.from('diary')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.gte('created_at', weeklyStart),
		locals.supabase
			.from('community_posts')
			.select('id, content, created_at')
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.limit(6)
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
	if (communityPostsResult.error && !isMissingTableError(communityPostsResult.error, 'community_posts')) {
		console.error('Dashboard community post load error:', communityPostsResult.error);
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

	let communityPreview: PortalCommunityPreview = {
		id: null,
		snippet: 'Gemenskapen fylls på steg för steg. Du kan läsa i lugn takt eller dela något när det känns rätt.',
		dateLabel: '',
		replyCount: null,
		hasActivity: false
	};

	const communityPosts = (communityPostsResult.data ?? []) as CommunityPostRow[];
	const postIds = communityPosts
		.map((post) => post.id)
		.filter((postId): postId is string => typeof postId === 'string' && postId.length > 0);

	if (postIds.length > 0) {
		const { data: communityComments, error: communityCommentsError } = await locals.supabase
			.from('community_comments')
			.select('post_id, created_at')
			.in('post_id', postIds)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.limit(60);

		if (communityCommentsError && !isMissingTableError(communityCommentsError, 'community_comments')) {
			console.error('Dashboard community comment load error:', communityCommentsError);
		}

		const commentRows = ((communityComments ?? []) as CommunityCommentRow[]).filter(
			(row) => typeof row.post_id === 'string' && row.post_id.length > 0
		);
		const activityByPostId = new Map<string, { latestActivity: string | null; replyCount: number }>();

		for (const post of communityPosts) {
			activityByPostId.set(post.id, {
				latestActivity: post.created_at,
				replyCount: 0
			});
		}

		for (const comment of commentRows) {
			const existing = activityByPostId.get(comment.post_id);
			if (!existing) continue;
			existing.replyCount += 1;
			if (
				comment.created_at &&
				(!existing.latestActivity || new Date(comment.created_at).getTime() > new Date(existing.latestActivity).getTime())
			) {
				existing.latestActivity = comment.created_at;
			}
		}

		const rankedPosts = [...communityPosts].sort((left, right) => {
			const leftActivity = activityByPostId.get(left.id)?.latestActivity ?? left.created_at ?? '';
			const rightActivity = activityByPostId.get(right.id)?.latestActivity ?? right.created_at ?? '';
			return new Date(rightActivity).getTime() - new Date(leftActivity).getTime();
		});

		const selectedPost = rankedPosts[0];
		if (selectedPost) {
			const activity = activityByPostId.get(selectedPost.id);
			communityPreview = {
				id: selectedPost.id,
				snippet: toSnippet(selectedPost.content, 150),
				dateLabel: formatDateLabel(activity?.latestActivity ?? selectedPost.created_at),
				replyCount: activity?.replyCount ?? 0,
				hasActivity: true
			};
		}
	}

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
		title: 'Min portal',
		description: 'En lugn översikt över dagbok, framsteg, gemenskap och inställningar.',
		diaryPreview,
		progressPreview,
		communityPreview,
		settingsPreview
	};
};
