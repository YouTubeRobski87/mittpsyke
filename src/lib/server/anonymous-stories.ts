import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

const FALLBACK_SALT = 'mittpsyke-local-anonymous-stories-salt';

function getStorySalt() {
	return (
		env.STORY_RATE_LIMIT_SALT ||
		env.IP_HASH_SALT ||
		env.SUPABASE_SERVICE_ROLE_KEY ||
		env.SERVICE_ROLE_KEY ||
		FALLBACK_SALT
	);
}

export function hashStoryIp(ipAddress: string) {
	return createHash('sha256')
		.update(`${getStorySalt()}:${ipAddress}`)
		.digest('hex');
}

export function createStoryLoadToken(loadedAt: number) {
	return createHmac('sha256', getStorySalt()).update(String(loadedAt)).digest('hex');
}

export function isValidStoryLoadToken(loadedAt: number, token: string) {
	const expected = createStoryLoadToken(loadedAt);

	try {
		return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
	} catch {
		return false;
	}
}
