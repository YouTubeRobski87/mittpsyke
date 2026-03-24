<script lang="ts">
	type DiaryMoodEntry = {
		created_at: string | null;
		mood: string | null;
	};

	type DailyMoodPoint = {
		date: string;
		averageMood: number | null;
		entriesCount: number;
	};

	type RangeDays = 7 | 30 | 90;

	type MoodDataResult = {
		points: DailyMoodPoint[];
		trimmedDays: number;
	};

	export let entries: DiaryMoodEntry[] = [];

	const RANGE_OPTIONS: RangeDays[] = [7, 30, 90];
	const EMPTY_STATE_PRIMARY = 'När du har sparat några inlägg börjar en lugn överblick att ta form här.';
	const EMPTY_STATE_SECONDARY =
		'Fortsätt skriva några dagar till, så blir det lättare att se mönster över tid.';

	let selectedRange: RangeDays = 30;
	let dailyMoodData: DailyMoodPoint[] = [];
	let trimmedDays = 0;
	let isSparseView = false;
	let hasEnoughData = false;
	let supportiveLine = '';

	function parseMood(value: string | null): number | null {
		if (!value) return null;
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) return null;
		if (numeric < 1 || numeric > 10) return null;
		return Math.round(numeric * 10) / 10;
	}

	function toDateKey(dateValue: string): string | null {
		const date = new Date(dateValue);
		if (Number.isNaN(date.getTime())) return null;

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function createDateRange(days: number): string[] {
		const result: string[] = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let offset = days - 1; offset >= 0; offset--) {
			const date = new Date(today);
			date.setDate(today.getDate() - offset);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			result.push(`${year}-${month}-${day}`);
		}

		return result;
	}

	function buildDailyMoodData(source: DiaryMoodEntry[], rangeDays: RangeDays): MoodDataResult {
		const grouped = new Map<string, { moodSum: number; moodCount: number; entriesCount: number }>();

		for (const entry of source) {
			if (!entry.created_at) continue;
			const dateKey = toDateKey(entry.created_at);
			if (!dateKey) continue;

			const bucket = grouped.get(dateKey) ?? { moodSum: 0, moodCount: 0, entriesCount: 0 };
			bucket.entriesCount += 1;

			const mood = parseMood(entry.mood);
			if (mood !== null) {
				bucket.moodSum += mood;
				bucket.moodCount += 1;
			}

			grouped.set(dateKey, bucket);
		}

		const fullRange = createDateRange(rangeDays);

		// Trim leading empty days so sparse data doesn't cluster to the right.
		// Keep LEAD_DAYS empty days before the first entry for visual breathing room.
		const LEAD_DAYS = 2;
		const SPARSE_THRESHOLD = Math.ceil(rangeDays * 0.25);
		const firstDataIndex = fullRange.findIndex((date) => grouped.has(date));

		let effectiveRange = fullRange;
		let trimmedDays = 0;

		if (firstDataIndex > SPARSE_THRESHOLD) {
			const startIdx = Math.max(0, firstDataIndex - LEAD_DAYS);
			effectiveRange = fullRange.slice(startIdx);
			trimmedDays = startIdx;
		}

		const points = effectiveRange.map((dateKey) => {
			const bucket = grouped.get(dateKey);
			if (!bucket) {
				return {
					date: dateKey,
					averageMood: null,
					entriesCount: 0
				};
			}

			return {
				date: dateKey,
				averageMood: bucket.moodCount > 0 ? Math.round((bucket.moodSum / bucket.moodCount) * 10) / 10 : null,
				entriesCount: bucket.entriesCount
			};
		});

		return { points, trimmedDays };
	}

	function buildSupportiveLine(points: DailyMoodPoint[], range: RangeDays): string {
		const totalEntries = points.reduce((sum, point) => sum + point.entriesCount, 0);
		const periodLabel = `de senaste ${range} dagarna`;
		const moodValues = points
			.map((point) => point.averageMood)
			.filter((value): value is number => typeof value === 'number');

		if (totalEntries === 0) {
			return `När du har skrivit några gånger ${periodLabel} blir mönster lättare att se.`;
		}

		const entryWord = totalEntries === 1 ? 'gång' : 'gånger';
		if (moodValues.length >= 3) {
			const spread = Math.max(...moodValues) - Math.min(...moodValues);
			if (spread >= 2.5) {
				return `Du har skrivit ${totalEntries} ${entryWord} ${periodLabel}. Det har svängt en del, vilket är helt normalt.`;
			}
		}

		return `Du har skrivit ${totalEntries} ${entryWord} ${periodLabel}. Små förändringar över tid räknas också.`;
	}

	$: ({ points: dailyMoodData, trimmedDays } = buildDailyMoodData(entries, selectedRange));
	$: isSparseView = trimmedDays > 0;
	$: hasEnoughData = dailyMoodData.filter((point) => point.averageMood !== null).length >= 2;
	$: supportiveLine = buildSupportiveLine(dailyMoodData, selectedRange);
</script>

<section class="auth-panel mood-timeline-panel" aria-labelledby="mood-timeline-title">
	<div class="timeline-head">
		<div class="timeline-copy">
			<h2 id="mood-timeline-title">Ditt mående över tid</h2>
			<p>
				En enkel överblick över hur dina dagar har känts. Det behöver inte gå spikrakt för att räknas som
				framsteg.
			</p>
		</div>

		<div class="timeline-filter" role="group" aria-label="Välj tidsintervall">
			{#each RANGE_OPTIONS as range}
				<button
					type="button"
					class={`timeline-filter-button ${selectedRange === range ? 'active' : ''}`}
					onclick={() => (selectedRange = range)}
				>
					{range} dagar
				</button>
			{/each}
		</div>
	</div>

	{#if hasEnoughData}
		<div class="timeline-summary" aria-live="polite">
			{#if isSparseView}
				<p class="timeline-summary-context timeline-summary-context--sparse">
					Dina anteckningar i den här perioden börjar vid ditt första sparade inlägg.
				</p>
			{:else}
				<p class="timeline-summary-context">En lugn textöverblick över hur dagarna har känts.</p>
			{/if}
		</div>
		<p class="timeline-note">Det här är en enkel överblick, inte en bedömning av dig.</p>
		<p class="timeline-supportive">{supportiveLine}</p>
	{:else}
		<div class="timeline-empty">
			<p>{EMPTY_STATE_PRIMARY}</p>
			<p>{EMPTY_STATE_SECONDARY}</p>
		</div>
		<p class="timeline-supportive">{supportiveLine}</p>
	{/if}
</section>

<style>
	.mood-timeline-panel {
		display: grid;
		gap: 1rem;
	}

	.timeline-head {
		display: grid;
		gap: 0.8rem;
	}

	.timeline-copy h2 {
		margin: 0;
		font-size: 1.12rem;
	}

	.timeline-copy p {
		margin: 0.45rem 0 0;
		font-size: 0.92rem;
		line-height: 1.65;
		color: hsl(var(--muted-foreground));
		max-width: 72ch;
	}

	.timeline-filter {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.timeline-filter-button {
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		color: hsl(var(--muted-foreground));
		border-radius: var(--radius-pill);
		padding: 0.35rem 0.72rem;
		font-size: 0.82rem;
		line-height: 1.2;
		cursor: pointer;
		transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
	}

	.timeline-filter-button:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--muted-foreground) / 0.5);
	}

	.timeline-filter-button.active {
		background: color-mix(in srgb, var(--theme-accent, var(--primary)) 12%, hsl(var(--surface)));
		border-color: color-mix(in srgb, var(--theme-accent, var(--primary)) 42%, hsl(var(--border)));
		color: hsl(var(--foreground));
	}

	.timeline-summary {
		padding: 0.9rem 0.95rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.timeline-summary-context {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
	}

	.timeline-summary-context--sparse {
		color: hsl(var(--muted-foreground) / 0.65);
		font-style: italic;
	}

	.timeline-note {
		margin: 0;
		font-size: 0.84rem;
		color: hsl(var(--muted-foreground));
	}

	.timeline-supportive {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	.timeline-empty {
		padding: 0.9rem 0.95rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
		display: grid;
		gap: 0.45rem;
	}

	.timeline-empty p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
	}

	@media (min-width: 860px) {
		.timeline-head {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
		}
	}
</style>
