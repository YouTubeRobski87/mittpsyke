<script lang="ts">
	interface HeatmapData {
		[date: string]: number;
	}

	type Period = 3 | 6 | 12 | 'all';
	type ActivityDay = {
		date: string;
		count: number;
		isToday: boolean;
		label: string;
	};
	type ActivityMonth = {
		key: string;
		name: string;
		year: string;
		days: ActivityDay[];
	};

	const DAY_MS = 24 * 60 * 60 * 1000;
	const periods: { value: Period; label: string }[] = [
		{ value: 3, label: '3 månader' },
		{ value: 6, label: '6 månader' },
		{ value: 12, label: '12 månader' },
		{ value: 'all', label: 'Alla' }
	];
	const monthFormatter = new Intl.DateTimeFormat('sv-SE', { month: 'long' });
	const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	let {
		data = {},
		error = '',
		loading = false
	}: {
		data?: HeatmapData;
		error?: string;
		loading?: boolean;
	} = $props();

	let selectedPeriod = $state<Period>(6);
	let activeDay = $state<string | null>(null);

	function addDays(date: Date, days: number) {
		const copy = new Date(date);
		copy.setDate(copy.getDate() + days);
		return copy;
	}

	function toDateKey(date: Date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function startOfMonth(date: Date) {
		return new Date(date.getFullYear(), date.getMonth(), 1);
	}

	function getActivityLevel(count: number) {
		if (count === 0) return 'Ingen aktivitet';
		if (count === 1) return 'Lite aktivitet';
		if (count === 2) return 'Någon aktivitet';
		return 'Mer aktivitet';
	}

	function getActivityTone(count: number) {
		if (count === 0) return 'none';
		if (count === 1) return 'low';
		if (count === 2) return 'medium';
		if (count === 3) return 'high';
		return 'high-plus';
	}

	function getDayLabel(date: Date, count: number) {
		const formattedDate = dateFormatter.format(date);
		if (count === 0) return `${formattedDate}: Ingen aktivitet`;
		return `${formattedDate}: Du skrev ${count} ${count === 1 ? 'inlägg' : 'inlägg'}. ${getActivityLevel(count)}.`;
	}

	function getFirstAvailableMonth(source: HeatmapData, fallback: Date) {
		const dates = Object.keys(source)
			.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
			.sort();
		if (!dates.length) return startOfMonth(addDays(fallback, -364));
		const [year, month] = dates[0].split('-').map(Number);
		return new Date(year, month - 1, 1);
	}

	function buildMonths(source: HeatmapData, period: Period): ActivityMonth[] {
		const now = new Date();
		const currentMonth = startOfMonth(now);
		const firstMonth = period === 'all'
			? getFirstAvailableMonth(source, now)
			: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - period + 1, 1);
		const months: ActivityMonth[] = [];

		for (let month = currentMonth; month >= firstMonth; month = new Date(month.getFullYear(), month.getMonth() - 1, 1)) {
			const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
			const daysInMonth = Math.round((nextMonth.getTime() - month.getTime()) / DAY_MS);
			const days = Array.from({ length: daysInMonth }, (_, index) => {
				const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
				const dateKey = toDateKey(date);
				const count = source[dateKey] ?? 0;
				return {
					date: dateKey,
					count,
					isToday: dateKey === toDateKey(now),
					label: getDayLabel(date, count)
				};
			});

			months.push({
				key: `${month.getFullYear()}-${month.getMonth()}`,
				name: monthFormatter.format(month),
				year: String(month.getFullYear()),
				days
			});
		}

		return months;
	}

	const months = $derived(buildMonths(data, selectedPeriod));
	const periodLabel = $derived(periods.find((period) => period.value === selectedPeriod)?.label ?? '6 månader');
</script>

<div class="activity-overview">
	{#if loading}
		<div class="loading">Laddar aktivitetsöversikt...</div>
	{:else if error}
		<div class="error">{error} Försök igen om en stund.</div>
	{:else}
		<div class="period-picker" aria-label="Välj tidsperiod för aktivitetsöversikten">
			{#each periods as period}
				<button
					type="button"
					class:active={selectedPeriod === period.value}
					aria-pressed={selectedPeriod === period.value}
					onclick={() => (selectedPeriod = period.value)}
				>
					{period.label}
				</button>
			{/each}
		</div>

		<div class="activity-frame">
			<div class="months-scroll" aria-label={`Aktivitetsöversikt för ${periodLabel}`}>
				<div class="month-list">
					{#each months as month}
						<section class="month-row" aria-label={`${month.name} ${month.year}`}>
							<div class="month-label" aria-hidden="true">
								<span>{month.name}</span>
								<small>{month.year}</small>
							</div>
							<div class="month-days">
								{#each month.days as day}
									<button
										type="button"
										class={`day-mark day-mark--${getActivityTone(day.count)}`}
										class:is-today={day.isToday}
										class:is-active={activeDay === day.date}
										aria-label={day.label}
										aria-describedby={activeDay === day.date ? `activity-tooltip-${day.date}` : undefined}
										onfocus={() => (activeDay = day.date)}
										onblur={() => (activeDay = null)}
										onmouseenter={() => (activeDay = day.date)}
										onmouseleave={() => (activeDay = null)}
										onclick={() => (activeDay = activeDay === day.date ? null : day.date)}
									>
										<span class="sr-only">{day.label}</span>
										{#if day.isToday}<span class="today-label">Idag</span>{/if}
										{#if activeDay === day.date}
											<span class="day-tooltip" id={`activity-tooltip-${day.date}`} role="tooltip">
												<strong>{dateFormatter.format(new Date(`${day.date}T12:00:00`))}</strong>
												<span>{day.count === 0 ? 'Ingen aktivitet' : `Du skrev ${day.count} ${day.count === 1 ? 'inlägg' : 'inlägg'}`}</span>
											</span>
										{/if}
									</button>
								{/each}
							</div>
						</section>
					{/each}
				</div>
			</div>
		</div>

		<div class="legend" aria-label="Förklaring av aktivitetsnivåer">
			<span><i class="legend-dot legend-dot--none"></i>Ingen aktivitet</span>
			<span><i class="legend-dot legend-dot--low"></i>Lite aktivitet</span>
			<span><i class="legend-dot legend-dot--medium"></i>Någon aktivitet</span>
			<span><i class="legend-dot legend-dot--high"></i><i class="legend-dot legend-dot--high-plus"></i>Mer aktivitet</span>
		</div>
	{/if}
</div>

<style>
	.activity-overview { width: 100%; min-inline-size: 0; }
	.loading, .error { min-block-size: 12rem; display: grid; place-items: center; text-align: center; padding: 1.5rem; }
	.loading { color: hsl(var(--muted-foreground)); }
	.error { color: hsl(var(--error-foreground)); }
	.period-picker { display: flex; flex-wrap: wrap; gap: .45rem; margin-bottom: 1rem; }
	.period-picker button { border: 1px solid rgba(177, 202, 226, .18); background: rgba(104, 132, 160, .13); color: rgba(235, 244, 252, .77); border-radius: 999px; padding: .5rem .82rem; font: inherit; font-size: .82rem; cursor: pointer; transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease; }
	.period-picker button:hover { background: rgba(121, 159, 192, .22); color: #fff; }
	.period-picker button.active { background: linear-gradient(135deg, #8a72bd, #597aa7); border-color: rgba(209, 198, 239, .6); color: #fff; box-shadow: 0 5px 16px rgba(63, 71, 123, .24); }
	.period-picker button:focus-visible, .day-mark:focus-visible { outline: 3px solid #d7cbff; outline-offset: 3px; }
	.activity-frame { border: 1px solid rgba(177, 202, 226, .12); border-radius: 1.15rem; padding: .7rem; background: linear-gradient(145deg, rgba(36, 58, 84, .62), rgba(16, 28, 43, .9)); box-shadow: inset 0 1px rgba(255,255,255,.045), 0 16px 35px rgba(0,0,0,.14); }
	.month-list { display: grid; gap: .5rem; }
	.month-row { display: grid; grid-template-columns: 5.75rem minmax(0, 1fr); gap: .75rem; align-items: center; padding: .55rem .4rem; border-radius: .85rem; }
	.month-row:nth-child(odd) { background: rgba(255,255,255,.025); }
	.month-label { display: grid; gap: .03rem; padding-left: .25rem; color: #e9f0f8; text-transform: capitalize; font-size: .9rem; font-weight: 650; line-height: 1.2; }
	.month-label small { color: rgba(191, 209, 226, .66); font-size: .74rem; font-weight: 500; }
	.month-days { display: grid; grid-template-columns: repeat(31, minmax(0, 1fr)); gap: clamp(.13rem, .38vw, .28rem); min-inline-size: 0; }
	.day-mark { position: relative; inline-size: 100%; aspect-ratio: 1; min-inline-size: 0; border: 1px solid rgba(255,255,255,.06); border-radius: clamp(.25rem, .7vw, .45rem); padding: 0; cursor: pointer; box-shadow: inset 0 1px rgba(255,255,255,.12); transition: transform .16s ease, filter .16s ease, box-shadow .16s ease; }
	.day-mark:hover, .day-mark.is-active { transform: translateY(-2px) scale(1.12); filter: brightness(1.16); z-index: 2; box-shadow: 0 5px 12px rgba(0,0,0,.3), inset 0 1px rgba(255,255,255,.22); }
	.day-mark--none { background: #233246; }
	.day-mark--low { background: #596f92; }
	.day-mark--medium { background: #6e8f86; }
	.day-mark--high { background: #9a79bb; }
	.day-mark--high-plus { background: #bd8fc4; }
	.day-mark.is-today { outline: 2px solid #f1e7c6; outline-offset: 2px; }
	.today-label { position: absolute; top: calc(100% + .38rem); left: 50%; transform: translateX(-50%); z-index: 3; padding: .12rem .35rem; border-radius: 999px; background: #f1e7c6; color: #172333; font-size: .62rem; font-weight: 700; white-space: nowrap; pointer-events: none; }
	.day-tooltip { position: absolute; z-index: 5; inset-block-end: calc(100% + .65rem); left: 50%; transform: translateX(-50%); display: grid; gap: .2rem; width: max-content; max-width: 13rem; padding: .56rem .65rem; border: 1px solid rgba(215, 203, 255, .35); border-radius: .65rem; background: #101b2a; color: #edf4fb; box-shadow: 0 10px 25px rgba(0,0,0,.35); font-size: .75rem; line-height: 1.35; pointer-events: none; }
	.day-tooltip strong { font-size: .78rem; }
	.legend { display: flex; flex-wrap: wrap; gap: .65rem 1rem; padding: .85rem .15rem 0; color: rgba(221, 232, 243, .78); font-size: .77rem; }
	.legend span { display: inline-flex; align-items: center; gap: .36rem; }
	.legend-dot { inline-size: .7rem; block-size: .7rem; border-radius: .23rem; border: 1px solid rgba(255,255,255,.13); }
	.legend-dot--none { background: #233246; } .legend-dot--low { background: #596f92; } .legend-dot--medium { background: #6e8f86; } .legend-dot--high { background: #9a79bb; } .legend-dot--high-plus { background: #bd8fc4; }
	.sr-only { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
	@media (max-width: 640px) { .period-picker { gap: .35rem; } .period-picker button { flex: 1 1 auto; padding-inline: .62rem; } .activity-frame { padding: .6rem; } .months-scroll { overflow-x: auto; overscroll-behavior-inline: contain; padding-bottom: .3rem; scrollbar-width: thin; scrollbar-color: rgba(185, 204, 226, .45) transparent; } .month-list { min-inline-size: 34rem; gap: .42rem; } .month-row { grid-template-columns: 4.55rem minmax(0, 1fr); gap: .55rem; padding: .48rem .25rem; } .month-label { font-size: .8rem; } .month-label small { font-size: .69rem; } .day-tooltip { position: fixed; inset: auto 1rem 1rem; transform: none; width: auto; max-width: none; text-align: left; } .legend { gap: .5rem .75rem; font-size: .72rem; } }
</style>
