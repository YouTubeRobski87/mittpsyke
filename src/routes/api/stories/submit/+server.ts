import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { isAgeRange, isGender } from '$lib/data/anonymous-stories';
import { createServiceClient, isMissingTableError } from '$lib/server/supabase-admin';
import {
	hasValidStoryRateLimitSalt,
	hashStoryIp,
	isValidStoryLoadToken
} from '$lib/server/anonymous-stories';
import type { RequestHandler } from './$types';

const MIN_CONTENT_LENGTH = 50;
const MAX_CONTENT_LENGTH = 2000;
const MAX_SUBMISSIONS_PER_DAY = 3;
const MIN_SUBMIT_DELAY_MS = 3000;
const MODERATION_AI_TIMEOUT_MS = 12_000;
const THANK_YOU_MESSAGE =
	'Tack. Din berättelse är mottagen och granskas innan eventuell publicering.';

type ModerationResult = {
	action: 'approve' | 'flag';
	reason: string | null;
};

function normalizeOptionalValue(value: FormDataEntryValue | null) {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function getClientIp(event: Parameters<RequestHandler>[0]) {
	const forwardedFor = event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
	if (forwardedFor) return forwardedFor;

	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
}

function parseModerationResponse(value: string | null | undefined): ModerationResult {
	if (!value) return { action: 'flag', reason: 'AI-svaret var tomt.' };

	try {
		const parsed = JSON.parse(value) as Partial<ModerationResult>;
		if (parsed.action === 'approve') return { action: 'approve', reason: null };
		if (parsed.action === 'flag') {
			const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';
			return { action: 'flag', reason: reason || 'AI flaggade berättelsen för manuell kontroll.' };
		}
	} catch {
		return { action: 'flag', reason: 'AI-svaret kunde inte tolkas som JSON.' };
	}

	return { action: 'flag', reason: 'AI-svaret saknade giltig åtgärd.' };
}

async function moderateStory(content: string): Promise<ModerationResult> {
	const apiKey = env.OPENAI_API_KEY?.trim();
	if (!apiKey) {
		return { action: 'flag', reason: 'AI-förmoderering kunde inte köras: API-nyckel saknas.' };
	}

	try {
		const openai = new OpenAI({ apiKey, timeout: MODERATION_AI_TIMEOUT_MS });
		const response = await openai.chat.completions.create({
			model: (env.OPENAI_STORY_MODERATION_MODEL || env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
			temperature: 0,
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content:
						'Du är moderator för anonyma berättelser om psykisk hälsa. Godkänn berättelser som är genuina, respektfulla och inte innehåller: namn på personer, skolor eller platser, explicita metoder för självskada/suicid, hatpropaganda, spam, eller reklam. Svara ENDAST med JSON: {"action": "approve" | "flag", "reason": "kort förklaring om flag"}'
				},
				{ role: 'user', content }
			]
		});

		return parseModerationResponse(response.choices[0]?.message?.content);
	} catch (error) {
		console.error('Story moderation error:', error);
		return { action: 'flag', reason: 'AI-förmoderering kunde inte köras.' };
	}
}

export const POST: RequestHandler = async (event) => {
	const form = await event.request.formData();
	const honeypot = normalizeOptionalValue(form.get('company'));
	const content = normalizeOptionalValue(form.get('content')) ?? '';
	const ageRange = normalizeOptionalValue(form.get('age_range'));
	const gender = normalizeOptionalValue(form.get('gender'));
	const emotionEmoji = normalizeOptionalValue(form.get('emotion_emoji'));
	const loadedAt = Number(normalizeOptionalValue(form.get('story_loaded_at')));
	const loadToken = normalizeOptionalValue(form.get('story_load_token')) ?? '';

	if (honeypot) {
		return json({ message: THANK_YOU_MESSAGE });
	}

	if (!hasValidStoryRateLimitSalt()) {
		return json({ message: 'Berättelsen kunde inte tas emot just nu.' }, { status: 500 });
	}

	if (
		!Number.isFinite(loadedAt) ||
		Date.now() - loadedAt < MIN_SUBMIT_DELAY_MS ||
		!isValidStoryLoadToken(loadedAt, loadToken)
	) {
		return json({ message: THANK_YOU_MESSAGE });
	}

	if (content.length < MIN_CONTENT_LENGTH || content.length > MAX_CONTENT_LENGTH) {
		return json(
			{ message: `Berättelsen behöver vara mellan ${MIN_CONTENT_LENGTH} och ${MAX_CONTENT_LENGTH} tecken.` },
			{ status: 400 }
		);
	}

	if (ageRange && !isAgeRange(ageRange)) {
		return json({ message: 'Välj ett giltigt åldersintervall.' }, { status: 400 });
	}

	if (gender && !isGender(gender)) {
		return json({ message: 'Välj ett giltigt alternativ för kön.' }, { status: 400 });
	}

	if (emotionEmoji && emotionEmoji.length > 8) {
		return json({ message: 'Känsloemoji får vara högst två emojis.' }, { status: 400 });
	}

	const supabase = createServiceClient();
	if (!supabase) {
		return json({ message: 'Berättelsen kunde inte tas emot just nu.' }, { status: 500 });
	}

	const ipHash = hashStoryIp(getClientIp(event));
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
	const { count, error: rateLimitError } = await supabase
		.from('anonymous_stories')
		.select('id', { count: 'exact', head: true })
		.eq('ip_hash', ipHash)
		.gte('created_at', since);

	if (rateLimitError) {
		console.error('Story rate limit error:', rateLimitError);
		return json({ message: 'Berättelsen kunde inte tas emot just nu.' }, { status: 500 });
	}

	if ((count ?? 0) >= MAX_SUBMISSIONS_PER_DAY) {
		return json(
			{ message: 'Du kan skicka in högst tre berättelser per dygn. Försök gärna igen senare.' },
			{ status: 429 }
		);
	}

	const moderation = await moderateStory(content);
	const { error } = await supabase.from('anonymous_stories').insert({
		content,
		age_range: ageRange,
		gender,
		emotion_emoji: emotionEmoji,
		status: 'pending',
		ai_flag_reason: moderation.action === 'flag' ? moderation.reason : null,
		ip_hash: ipHash
	});

	if (error) {
		console.error('Story submit error:', error);
		return json(
			{
				message: isMissingTableError(error, 'anonymous_stories')
					? 'Berättelser är inte aktiverade ännu.'
					: 'Berättelsen kunde inte tas emot just nu.'
			},
			{ status: 500 }
		);
	}

	return json({ message: THANK_YOU_MESSAGE });
};
