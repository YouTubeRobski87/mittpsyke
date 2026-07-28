// Delad in-memory rate limiter för API-routes på en enda Node-process (Render).
// Formaliserar mönstret som redan fanns duplicerat i t.ex. diary/reflect och
// hibp/breaches: en sliding-window-räknare per nyckel (user-id eller IP), med
// gräns på antal nycklar så minnet inte växer obegränsat vid stigande trafik.

type Bucket = {
	count: number;
	resetAt: number;
};

export class RateLimiter {
	private buckets = new Map<string, Bucket>();

	constructor(
		private windowMs: number,
		private maxRequests: number,
		private maxKeys = 5000
	) {}

	/** true om nyckeln just nu är över gränsen (och räknar inte anropet). */
	isLimited(key: string, now = Date.now()): boolean {
		const bucket = this.buckets.get(key);
		if (!bucket || bucket.resetAt <= now) return false;
		return bucket.count >= this.maxRequests;
	}

	/**
	 * Registrerar ett anrop för nyckeln och returnerar om det ska nekas.
	 * Städar bort utgångna nycklar när kartan börjar bli stor, så minnet inte
	 * växer obegränsat när fler unika användare/IP:n dyker upp över tid.
	 */
	consume(key: string, now = Date.now()): boolean {
		if (this.buckets.size > this.maxKeys) {
			for (const [bucketKey, bucket] of this.buckets) {
				if (bucket.resetAt <= now) this.buckets.delete(bucketKey);
			}
		}

		const bucket = this.buckets.get(key);
		if (!bucket || bucket.resetAt <= now) {
			this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
			return false;
		}

		bucket.count += 1;
		return bucket.count > this.maxRequests;
	}
}
