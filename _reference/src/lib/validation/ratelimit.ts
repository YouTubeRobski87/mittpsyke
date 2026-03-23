import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// Initialize Redis client (lazy - only when needed)
let ratelimit: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
	if (ratelimit) return ratelimit;

	const upstashUrl = env.UPSTASH_REDIS_REST_URL;
	const upstashToken = env.UPSTASH_REDIS_REST_TOKEN;

	if (!upstashUrl || !upstashToken) {
		console.error('Upstash credentials not configured. Rate limiting will fail closed.');
		return null;
	}

	const redis = new Redis({
		url: upstashUrl,
		token: upstashToken
	});

	ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
		analytics: true
	});

	return ratelimit;
}

// Separate rate limiter for chat messages (50 req/hr vs 10 req/hr for generate)
let chatRatelimit: Ratelimit | null = null;

function getChatRateLimiter(): Ratelimit | null {
	if (chatRatelimit) return chatRatelimit;

	const upstashUrl = env.UPSTASH_REDIS_REST_URL;
	const upstashToken = env.UPSTASH_REDIS_REST_TOKEN;

	if (!upstashUrl || !upstashToken) {
		console.error('Upstash credentials not configured. Rate limiting will fail closed.');
		return null;
	}

	const redis = new Redis({
		url: upstashUrl,
		token: upstashToken
	});

	chatRatelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 requests per hour
		analytics: true,
		prefix: 'ratelimit:chat'
	});

	return chatRatelimit;
}

export interface RateLimitResult {
	success: boolean;
	remaining: number;
	reset: number;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
	const limiter = getRateLimiter();

	if (!limiter) {
		// Rate limiting not configured - fail closed to prevent abuse
		console.error('Rate limiter unavailable. Blocking request.');
		return { success: false, remaining: 0, reset: Date.now() + 60_000 };
	}

	try {
		const { success, remaining, reset } = await limiter.limit(identifier);
		return { success, remaining, reset };
	} catch (error) {
		console.error('Rate limit check failed:', error);
		// On error, fail closed to prevent abuse
		return { success: false, remaining: 0, reset: Date.now() + 60_000 };
	}
}

export async function checkChatRateLimit(identifier: string): Promise<RateLimitResult> {
	const limiter = getChatRateLimiter();

	if (!limiter) {
		console.error('Chat rate limiter unavailable. Blocking request.');
		return { success: false, remaining: 0, reset: Date.now() + 60_000 };
	}

	try {
		const { success, remaining, reset } = await limiter.limit(identifier);
		return { success, remaining, reset };
	} catch (error) {
		console.error('Chat rate limit check failed:', error);
		return { success: false, remaining: 0, reset: Date.now() + 60_000 };
	}
}

// Extract IP from SvelteKit request
export function getClientIdentifier(request: Request): string {
	// Vercel sets x-forwarded-for header
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}

	// Fallback to x-real-ip
	const realIp = request.headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}

	// Final fallback
	return 'unknown';
}
