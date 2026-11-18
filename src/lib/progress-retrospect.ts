export type RetrospectPeriod = 30 | 90;
export type RetrospectSegment = 0 | 1 | 2;

export const RETROSPECT_SEGMENTS = ['Tidigare delen', 'Mitten', 'Senare delen'] as const;
export const MAX_RETROSPECT_SOURCES = 4;

export type RetrospectSource = {
	ref: number;
	entryId: string;
	date: string;
	segment: RetrospectSegment;
	excerpt: string;
};

export type RetrospectPreview = {
	snapshotId: string;
	sources: RetrospectSource[];
	candidates: RetrospectSource[];
};

export type RetrospectObservation = {
	text: string;
	refs: number[];
};

export type RetrospectResult = {
	observations: RetrospectObservation[];
	sources: RetrospectSource[];
	question: string | null;
};

export function isRetrospectPeriod(value: unknown): value is RetrospectPeriod {
	return value === 30 || value === 90;
}

export async function retrospectSnapshotId(userId: string, period: RetrospectPeriod, sources: RetrospectSource[]) {
	const data = new TextEncoder().encode(JSON.stringify([userId, period, sources]));
	const digest = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}
