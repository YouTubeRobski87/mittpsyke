import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { createServiceClient, isMissingTableError } from '$lib/server/supabase-admin';

export const COMPREHENSION_ANSWERS = ['yes', 'partial', 'no'] as const;
export const COMPREHENSION_SOURCE = 'framsteg_comprehension' as const;

export type ComprehensionAnswer = (typeof COMPREHENSION_ANSWERS)[number];
export type ComprehensionWriteStatus =
	| 'written'
	| 'duplicate'
	| 'skipped_no_salt'
	| 'skipped_no_service_client'
	| 'skipped_missing_table'
	| 'failed';

const USER_REF_DOMAIN = 'framsteg_comprehension:v1';
const UNIQUE_VIOLATION = '23505';

export function isComprehensionAnswer(value: unknown): value is ComprehensionAnswer {
	return (
		typeof value === 'string' &&
		(COMPREHENSION_ANSWERS as readonly string[]).includes(value)
	);
}

export function createComprehensionUserRef(userId: string): string | null {
	const salt = env.FUNNEL_USER_REF_SALT;
	const trimmed = userId.trim();
	if (!salt || !trimmed) return null;

	return createHmac('sha256', salt).update(`${USER_REF_DOMAIN}:${trimmed}`).digest('hex');
}

export async function recordFramstegComprehension(input: {
	userId: string;
	clarity: ComprehensionAnswer;
	worldChange: ComprehensionAnswer;
}): Promise<ComprehensionWriteStatus> {
	const userRef = createComprehensionUserRef(input.userId);
	if (!userRef) return 'skipped_no_salt';

	const admin = createServiceClient();
	if (!admin) return 'skipped_no_service_client';

	try {
		const { error } = await admin.from('framsteg_comprehension_responses').insert({
			user_ref: userRef,
			clarity_answer: input.clarity,
			world_change_answer: input.worldChange,
			source: COMPREHENSION_SOURCE
		});

		if (!error) return 'written';
		if (error.code === UNIQUE_VIOLATION) return 'duplicate';
		if (isMissingTableError(error, 'framsteg_comprehension_responses')) {
			return 'skipped_missing_table';
		}

		console.error('[framsteg-comprehension] kunde inte spara svar:', error.code ?? error.message);
		return 'failed';
	} catch (error) {
		console.error(
			'[framsteg-comprehension] oväntat fel:',
			error instanceof Error ? error.message : 'okänt fel'
		);
		return 'failed';
	}
}
