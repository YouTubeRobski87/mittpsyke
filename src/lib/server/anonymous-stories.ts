import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

const MIN_STORY_RATE_LIMIT_SALT_LENGTH = 32;

function getStorySalt() {
	const salt = env.STORY_RATE_LIMIT_SALT?.trim();
	if (!salt || salt.length < MIN_STORY_RATE_LIMIT_SALT_LENGTH) {
		throw new Error('Anonymous story rate limiting is not configured.');
	}

	return salt;
}

export function hasValidStoryRateLimitSalt() {
	const salt = env.STORY_RATE_LIMIT_SALT?.trim();
	return Boolean(salt && salt.length >= MIN_STORY_RATE_LIMIT_SALT_LENGTH);
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
