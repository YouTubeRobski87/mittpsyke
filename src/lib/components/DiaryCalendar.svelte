<script lang="ts">
	// Kalenderkomponent för dagboken.
	// Visar en månadskalender med markerade dagar som har inlägg.
	// Klick på en dag filtrerar inläggen nedan via onDaySelect-callback.

	type CalendarEntry = {
		id: string;
		created_at: string | null;
	};

	type CalendarDay = {
		dateKey: string; // YYYY-MM-DD
		dayOfMonth: number;
		isCurrentMonth: boolean;
		isToday: boolean;
		hasEntry: boolean;
	};

	let {
		entries,
		onDaySelect
	}: {
		entries: CalendarEntry[];
		onDaySelect: (dateKey: string | null) => void;
	} = $props();

	// Synlig månad (0-indexerad som Date.getMonth)
	let visibleYear = $state(new Date().getFullYear());
	let visibleMonth = $state(new Date().getMonth());

	// Valt datum som YYYY-MM-DD, null = visa alla
	let selectedDateKey = $state<string | null>(null);

	// Bygger en Set av YYYY-MM-DD som faktiskt har inlägg
	const entryDates = $derived.by(() => {
		const set = new Set<string>();
		for (const entry of entries) {
			if (!entry.created_at) continue;
			const d = new Date(entry.created_at);
			if (Number.isNaN(d.getTime())) continue;
			set.add(toKey(d));
		}
		return set;
	});

	// Beräknar alla kalenderceller för synlig månad
	const calendarDays = $derived.by(() => buildCalendarDays(visibleYear, visibleMonth));

	// Rubrik för aktuell månad ("april 2026")
	const monthLabel = $derived(
		new Date(visibleYear, visibleMonth, 1).toLocaleDateString('sv-SE', {
			month: 'long',
			year: 'numeric'
		})
	);

	// Antal inlägg i den synliga månaden
	const entriesThisMonth = $derived.by(() => {
		const prefix = `${visibleYear}-${String(visibleMonth + 1).padStart(2, '0')}-`;
		return [...entryDates].filter((k) => k.startsWith(prefix)).length;
	});

	function toKey(date: Date): string {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	function buildCalendarDays(year: number, month: number): CalendarDay[] {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const todayKey = toKey(new Date());

		// Måndag = 0 i sv-SE — justera från JS (söndag = 0)
		let startPadding = firstDay.getDay() - 1;
		if (startPadding < 0) startPadding = 6;

		const days: CalendarDay[] = [];

		// Fyll föregående månads avslutande dagar (grå)
		for (let i = startPadding - 1; i >= 0; i--) {
			const d = new Date(year, month, -i);
			days.push({
				dateKey: toKey(d),
				dayOfMonth: d.getDate(),
				isCurrentMonth: false,
				isToday: false,
				hasEntry: false
			});
		}

		// Aktuell månads dagar
		for (let day = 1; day <= lastDay.getDate(); day++) {
			const d = new Date(year, month, day);
			const key = toKey(d);
			days.push({
				dateKey: key,
				dayOfMonth: day,
				isCurrentMonth: true,
				isToday: key === todayKey,
				hasEntry: entryDates.has(key)
			});
		}

		return days;
	}

	function goToPrevMonth() {
		if (visibleMonth === 0) {
			visibleMonth = 11;
			visibleYear -= 1;
		} else {
			visibleMonth -= 1;
		}
	}

	function goToNextMonth() {
		if (visibleMonth === 11) {
			visibleMonth = 0;
			visibleYear += 1;
		} else {
			visibleMonth += 1;
		}
	}

	function handleDayClick(day: CalendarDay) {
		if (!day.isCurrentMonth) return;
		const next = selectedDateKey === day.dateKey ? null : day.dateKey;
		selectedDateKey = next;
		onDaySelect(next);
	}

	function clearFilter() {
		selectedDateKey = null;
		onDaySelect(null);
	}

	// Formatera valt datum för visning ("3 april")
	function formatSelectedDate(key: string): string {
		const [y, m, d] = key.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
	}
</script>

<section class="diary-calendar auth-panel" aria-label="Kalenderöversikt för dagboken">
	<div class="cal-header">
		<button
			type="button"
			class="cal-nav-btn"
			onclick={goToPrevMonth}
			aria-label="Föregående månad"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<div class="cal-month-wrap">
			<h3 class="cal-month-label">{monthLabel}</h3>
			{#if entriesThisMonth > 0}
				<span class="cal-month-count">{entriesThisMonth} inlägg</span>
			{/if}
		</div>
		<button
			type="button"
			class="cal-nav-btn"
			onclick={goToNextMonth}
			aria-label="Nästa månad"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M9 18l6-6-6-6" />
			</svg>
		</button>
	</div>

	<div class="cal-weekdays" aria-hidden="true">
		{#each ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'] as wd}
			<span class="cal-wd">{wd}</span>
		{/each}
	</div>

	<div class="cal-grid" role="grid" aria-label={monthLabel}>
		{#each calendarDays as day (day.dateKey)}
			<button
				type="button"
				role="gridcell"
				class="cal-day"
				class:cal-day--other={!day.isCurrentMonth}
				class:cal-day--today={day.isToday}
				class:cal-day--has-entry={day.hasEntry && day.isCurrentMonth}
				class:cal-day--selected={selectedDateKey === day.dateKey}
				onclick={() => handleDayClick(day)}
				disabled={!day.isCurrentMonth}
				aria-label={day.isCurrentMonth
					? `${day.dayOfMonth} ${monthLabel}${day.hasEntry ? ', har inlägg' : ''}`
					: undefined}
				aria-selected={selectedDateKey === day.dateKey ? true : undefined}
				aria-pressed={day.isCurrentMonth ? selectedDateKey === day.dateKey : undefined}
			>
				<span class="cal-day-num">{day.dayOfMonth}</span>
				{#if day.hasEntry && day.isCurrentMonth}
					<span class="cal-dot" aria-hidden="true"></span>
				{/if}
			</button>
		{/each}
	</div>

	{#if selectedDateKey}
		<p class="cal-filter-hint">
			Visar inlägg för {formatSelectedDate(selectedDateKey)}.
			<button type="button" class="cal-clear-btn" onclick={clearFilter}>Visa alla</button>
		</p>
	{/if}
</section>

<style>
	.diary-calendar {
		display: grid;
		gap: 0.75rem;
	}

	/* ── Header ── */
	.cal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.cal-month-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		justify-content: center;
	}

	.cal-month-label {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 600;
		text-transform: capitalize;
		color: hsl(var(--foreground));
	}

	.cal-month-count {
		font-size: 0.72rem;
		color: hsl(var(--muted-foreground));
		background: hsl(var(--surface-muted));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-pill);
		padding: 0.1rem 0.45rem;
		white-space: nowrap;
	}

	.cal-nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface));
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: border-color 130ms ease, color 130ms ease, background-color 130ms ease;
		flex-shrink: 0;
	}

	.cal-nav-btn:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--muted-foreground) / 0.5);
		background: hsl(var(--surface-soft));
	}

	/* ── Veckodagar ── */
	.cal-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.15rem;
	}

	.cal-wd {
		text-align: center;
		font-size: 0.7rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		padding-bottom: 0.2rem;
		letter-spacing: 0.02em;
	}

	/* ── Kalendergrid ── */
	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.18rem;
	}

	.cal-day {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		min-height: 2rem;
		border: 1px solid transparent;
		border-radius: 8px;
		background: transparent;
		cursor: pointer;
		transition: background-color 130ms ease, border-color 130ms ease;
		padding: 0;
		gap: 2px;
	}

	.cal-day-num {
		font-size: 0.8rem;
		line-height: 1;
		color: hsl(var(--foreground));
	}

	/* Grå dagar utanför månaden */
	.cal-day--other {
		opacity: 0.22;
		cursor: default;
		pointer-events: none;
	}

	/* Dagens datum */
	.cal-day--today {
		border-color: hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.cal-day--today .cal-day-num {
		font-weight: 700;
	}

	/* Dagar med inlägg: subtil grön bakgrundston */
	.cal-day--has-entry:not(.cal-day--selected) {
		background: color-mix(in srgb, var(--primary, #436e8f) 9%, transparent);
	}

	/* Grön prick-markör under siffran */
	.cal-dot {
		display: block;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--primary, #436e8f);
		opacity: 0.85;
	}

	/* Valt datum */
	.cal-day--selected {
		background: color-mix(in srgb, var(--primary, #436e8f) 20%, hsl(var(--surface)));
		border-color: color-mix(in srgb, var(--primary, #436e8f) 50%, hsl(var(--border)));
	}

	.cal-day--selected .cal-day-num {
		font-weight: 700;
		color: color-mix(in srgb, var(--primary, #436e8f) 80%, hsl(var(--foreground)));
	}

	.cal-day--selected .cal-dot {
		opacity: 1;
	}

	/* Hover på ej valda dagar */
	.cal-day:not(:disabled):not(.cal-day--selected):hover {
		background: hsl(var(--surface-soft));
		border-color: hsl(var(--border));
	}

	/* ── Filtertext ── */
	.cal-filter-hint {
		margin: 0;
		font-size: 0.82rem;
		color: hsl(var(--muted-foreground));
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.cal-clear-btn {
		border: none;
		background: transparent;
		padding: 0;
		font-size: 0.82rem;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.cal-clear-btn:hover {
		color: hsl(var(--foreground));
	}
</style>
