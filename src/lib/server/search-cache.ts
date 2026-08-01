// Enkel process-lokal TTL-cache. Räcker gott för ett Node-baserat webbservice
// (Render) med en långlivad process - ingen extern cache-infrastruktur behövs
// för att undvika upprepade embedding-anrop för samma/populära sökningar.

type CacheEntry<T> = { value: T; expiresAt: number };

export class TtlCache<T> {
	private store = new Map<string, CacheEntry<T>>();

	constructor(
		private ttlMs: number,
		private maxEntries = 200
	) {}

	get(key: string): T | undefined {
		const entry = this.store.get(key);
		if (!entry) return undefined;

		if (entry.expiresAt < Date.now()) {
			this.store.delete(key);
			return undefined;
		}

		return entry.value;
	}

	set(key: string, value: T): void {
		if (this.store.size >= this.maxEntries) {
			const oldestKey = this.store.keys().next().value;
			if (oldestKey !== undefined) this.store.delete(oldestKey);
		}

		this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
	}
}
