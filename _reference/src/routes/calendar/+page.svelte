<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/supabase/client';
	import { EmojiCalendar, EmojiCompass, EmojiRocket, EmojiSpeakingHead, EmojiPencil } from '$lib/assets/emojis';
	import UniqueEmoji from '$lib/components/UniqueEmoji.svelte';
	import LegalFooter from '$lib/components/LegalFooter.svelte';
	import IconArrowLeft from '$lib/assets/icons/IconArrowLeft.svelte';

	function getNow(): Date {
		return new Date();
	}

	const initialNow = getNow();
	let todayYear = $state(initialNow.getFullYear());
	let todayMonth = $state(initialNow.getMonth()); // 0-indexed
	let todayDay = $state(initialNow.getDate());
	let isLoading = $state(true);

	// Calendar state
	let currentYear = $state(initialNow.getFullYear());
	let currentMonth = $state(initialNow.getMonth()); // 0-indexed
	let entryCounts = $state<Map<string, number>>(new Map());

	// Swipe state
	let touchStartX = $state(0);

	const swedishMonths = [
		'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
		'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
	];

	const weekdayHeaders = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

	const todayStr = $derived(
		`${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`
	);

	function formatDateStr(year: number, month: number, day: number): string {
		return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	}

	function getDaysInMonth(year: number, month: number): number {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstWeekday(year: number, month: number): number {
		const day = new Date(year, month, 1).getDay();
		return day === 0 ? 6 : day - 1;
	}

	// Streak calculations
	function computeStreaks(counts: Map<string, number>) {
		if (counts.size === 0) return { current: 0, longest: 0 };

		const dates = Array.from(counts.keys()).sort();

		// Longest streak
		let longest = 1;
		let run = 1;
		for (let i = 1; i < dates.length; i++) {
			const prev = new Date(dates[i - 1]);
			const curr = new Date(dates[i]);
			const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
			if (diffDays === 1) {
				run++;
				if (run > longest) longest = run;
			} else {
				run = 1;
			}
		}

		// Current streak: count backwards from today (or yesterday)
		let current = 0;
		const check = new Date(todayYear, todayMonth, todayDay);
		if (!counts.has(todayStr)) {
			check.setDate(check.getDate() - 1);
		}
		while (true) {
			const ds = formatDateStr(check.getFullYear(), check.getMonth(), check.getDate());
			if (counts.has(ds)) {
				current++;
				check.setDate(check.getDate() - 1);
			} else {
				break;
			}
		}

		return { current, longest };
	}

	const streaks = $derived(computeStreaks(entryCounts));

	// Monthly stats
	function computeMonthStats(year: number, month: number, counts: Map<string, number>) {
		const daysInMonth = getDaysInMonth(year, month);
		const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;

		let monthEntries = 0;
		let activeDays = 0;
		for (const [date, count] of counts) {
			if (date.startsWith(monthPrefix)) {
				monthEntries += count;
				activeDays++;
			}
		}

		let totalEntries = 0;
		for (const count of counts.values()) {
			totalEntries += count;
		}

		const activePct = daysInMonth > 0 ? Math.round((activeDays / daysInMonth) * 100) : 0;

		return { monthEntries, totalEntries, activeDays, activePct };
	}

	const monthStats = $derived(computeMonthStats(currentYear, currentMonth, entryCounts));

	function computeCalendarDays(year: number, month: number) {
		const daysInMonth = getDaysInMonth(year, month);
		const firstWeekday = getFirstWeekday(year, month);
		const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

		// Previous month padding
		const prevMonth = month === 0 ? 11 : month - 1;
		const prevYear = month === 0 ? year - 1 : year;
		const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

		for (let i = firstWeekday - 1; i >= 0; i--) {
			const d = daysInPrevMonth - i;
			days.push({ day: d, dateStr: formatDateStr(prevYear, prevMonth, d), isCurrentMonth: false });
		}

		// Current month
		for (let d = 1; d <= daysInMonth; d++) {
			days.push({ day: d, dateStr: formatDateStr(year, month, d), isCurrentMonth: true });
		}

		// Next month padding
		const remaining = 7 - (days.length % 7);
		if (remaining < 7) {
			const nextMonth = month === 11 ? 0 : month + 1;
			const nextYear = month === 11 ? year + 1 : year;
			for (let d = 1; d <= remaining; d++) {
				days.push({ day: d, dateStr: formatDateStr(nextYear, nextMonth, d), isCurrentMonth: false });
			}
		}

		return days;
	}

	const calendarDays = $derived(computeCalendarDays(currentYear, currentMonth));

	function navigateMonth(delta: number) {
		let newMonth = currentMonth + delta;
		let newYear = currentYear;
		if (newMonth < 0) {
			newMonth = 11;
			newYear--;
		} else if (newMonth > 11) {
			newMonth = 0;
			newYear++;
		}
		currentMonth = newMonth;
		currentYear = newYear;
	}

	function syncWithClientDate() {
		const now = getNow();
		todayYear = now.getFullYear();
		todayMonth = now.getMonth();
		todayDay = now.getDate();
		currentMonth = todayMonth;
		currentYear = todayYear;
	}

	const isCurrentMonthView = $derived(
		currentYear === todayYear && currentMonth === todayMonth
	);

	function isFutureDate(dateStr: string): boolean {
		return dateStr > todayStr;
	}

	// Modal state
	let showModeModal = $state(false);
	let selectedDate = $state('');

	const writingModes = [
		{ id: 'wizard', title: 'Steg-för-steg', icon: EmojiCompass, href: '/wizard' },
		{ id: 'quick', title: 'Snabbläge', icon: EmojiRocket, href: '/quick' },
		{ id: 'interview', title: 'AI-intervju', icon: EmojiSpeakingHead, href: '/interview' },
		{ id: 'editor', title: 'Skriv fritt', icon: EmojiPencil, href: '/editor' }
	];

	function handleDayClick(dateStr: string, isCurrentMonth: boolean) {
		if (!isCurrentMonth || isFutureDate(dateStr)) return;

		if (entryCounts.has(dateStr)) {
			goto(`/journal?date=${dateStr}`);
		} else {
			selectedDate = dateStr;
			showModeModal = true;
		}
	}

	function closeModeModal() {
		showModeModal = false;
	}

	// Swipe handlers (touch only, not trackpad)
	function handlePointerDown(e: PointerEvent) {
		if (e.pointerType !== 'touch') return;
		touchStartX = e.clientX;
	}

	function handlePointerUp(e: PointerEvent) {
		if (e.pointerType !== 'touch' || touchStartX === 0) return;
		const diff = touchStartX - e.clientX;
		if (Math.abs(diff) > 50) {
			navigateMonth(diff > 0 ? 1 : -1);
		}
		touchStartX = 0;
	}

	async function loadEntryDates() {
		const { data, error } = await supabase
			.from('entries')
			.select('entry_date');

		if (!error && data) {
			const counts = new Map<string, number>();
			for (const e of data) {
				counts.set(e.entry_date, (counts.get(e.entry_date) || 0) + 1);
			}
			entryCounts = counts;
		}
		isLoading = false;
	}

	onMount(() => {
		// Avoid SSR timezone drift (e.g. server already in next month, user still in current month).
		syncWithClientDate();

		const checkAuth = () => {
			if (authStore.isLoading) {
				setTimeout(checkAuth, 50);
				return;
			}
			if (!authStore.isLoggedIn) {
				goto('/login');
				return;
			}
			loadEntryDates();
		};
		checkAuth();
	});
</script>

<div class="calendar-page">
	<div class="calendar-container">
		<div class="calendar-header">
			<div class="header-icon"><UniqueEmoji><EmojiCalendar size={72} /></UniqueEmoji></div>
			<h1 class="calendar-title">Kalender</h1>
			<p class="calendar-subtitle">Följ din skrivresa och bygg upp din streak dag för dag</p>
		</div>

		{#if isLoading}
			<div class="calendar-loading">
				<span class="spinner"></span>
				<p>Laddar kalender...</p>
			</div>
		{:else}
			<!-- Streak bar -->
			<div class="streak-bar">
				<div class="streak-item">
					<span class="streak-value">{streaks.current}</span>
					<span class="streak-label">dagars streak</span>
				</div>
				<div class="streak-divider"></div>
				<div class="streak-item">
					<span class="streak-value">{streaks.longest}</span>
					<span class="streak-label">längsta streak</span>
				</div>
			</div>

			<div class="month-nav">
				<button class="nav-btn" onclick={() => navigateMonth(-1)} aria-label="Föregående månad">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
				</button>
				<div class="month-label-group">
					<h2 class="month-label">{swedishMonths[currentMonth]} {currentYear}</h2>
				</div>
				<button class="nav-btn" onclick={() => navigateMonth(1)} aria-label="Nästa månad">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
				</button>
			</div>

			<div class="calendar-grid">
				{#each weekdayHeaders as header}
					<div class="weekday-header" role="columnheader">{header}</div>
				{/each}

				{#each calendarDays as { day, dateStr, isCurrentMonth }}
					{@const count = entryCounts.get(dateStr) || 0}
					{@const clickable = isCurrentMonth && !isFutureDate(dateStr)}
					<button
						type="button"
						class="day-cell"
						class:outside={!isCurrentMonth}
						class:today={dateStr === todayStr}
						class:has-entry={count > 0}
						class:clickable
						class:future={isCurrentMonth && isFutureDate(dateStr)}
						class:heat-1={count === 1}
						class:heat-2={count >= 2 && count <= 3}
						class:heat-3={count >= 4}
						onclick={() => handleDayClick(dateStr, isCurrentMonth)}
						disabled={!clickable}
						aria-label={`${day} ${swedishMonths[currentMonth]}${count > 0 ? `, ${count} inlägg` : ''}`}
					>
						<span class="day-number">{day}</span>
						{#if count === 1}
							<span class="entry-dot"></span>
						{:else if count > 1}
							<span class="entry-count">{count}</span>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Monthly stats -->
			<div class="month-stats">
				<div class="stat">
					<span class="stat-value">{monthStats.monthEntries}</span>
					<span class="stat-label">inlägg denna månad</span>
				</div>
				<div class="stat">
					<span class="stat-value">{monthStats.totalEntries}</span>
					<span class="stat-label">inlägg totalt</span>
				</div>
				<div class="stat">
					<span class="stat-value">{monthStats.activeDays}</span>
					<span class="stat-label">aktiva dagar</span>
				</div>
			</div>
		{/if}

		<footer class="calendar-footer">
			<a href="/profile" class="btn btn-secondary"><IconArrowLeft size={16} /> Tillbaka</a>
		</footer>
	</div>
	<LegalFooter />
</div>

{#if showModeModal}
	<div class="modal-overlay" onclick={closeModeModal} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && closeModeModal()}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeModeModal()} role="dialog" aria-modal="true" aria-labelledby="mode-modal-title" tabindex="-1">
			<h2 id="mode-modal-title" class="modal-title">Skriv en dagbok</h2>
			<p class="modal-description">Välj hur du vill skriva dagens anteckning.</p>
			<div class="mode-grid">
				{#each writingModes as mode}
					<a href={mode.href} class="mode-card" onclick={closeModeModal}>
						<div class="mode-card-icon">
							<mode.icon size={36} />
						</div>
						<span class="mode-card-title">{mode.title}</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.calendar-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		padding-top: 1rem;
	}

	.calendar-container {
		flex: 1;
		width: 100%;
		max-width: 700px;
	}

	.calendar-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.8;
		margin-bottom: 0.75rem;
	}

	.calendar-title {
		font-family: var(--font-primary);
		font-size: var(--text-3xl);
		font-weight: var(--weight-medium);
		font-stretch: 115%;
		letter-spacing: var(--tracking-tighter);
		line-height: var(--leading-tight);
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.calendar-subtitle {
		font-family: var(--font-primary);
		font-size: var(--text-base);
		color: var(--color-text-muted);
		font-weight: var(--weight-book);
		letter-spacing: var(--tracking-wide);
		margin: 0;
	}

	/* Streak bar */
	.streak-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		padding: 1rem 1.25rem;
		margin-bottom: 1.25rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.streak-item {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
	}

	.streak-value {
		font-family: var(--font-primary);
		font-size: var(--text-2xl);
		font-weight: var(--weight-semibold);
		font-stretch: 110%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-accent);
		line-height: 1;
	}

	.streak-label {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.streak-divider {
		width: 1px;
		height: 1.5rem;
		background: var(--color-border);
	}

	/* Month navigation */
	.month-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.month-label-group {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.month-label {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-bg-elevated);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.nav-btn:hover {
		border-color: var(--color-accent);
		color: var(--color-text);
	}

	/* Calendar grid */
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--color-border);
		gap: 1px;
	}

	.weekday-header {
		padding: 0.625rem 0;
		text-align: center;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--color-text-muted);
		background: var(--color-bg-elevated);
	}

	.day-cell {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		aspect-ratio: 1;
		background: var(--color-bg-elevated);
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		transition: background-color 0.1s ease;
	}

	.day-cell.clickable {
		cursor: pointer;
	}

	.day-cell.clickable:hover {
		background: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-elevated));
	}

	.day-cell.outside,
	.day-cell.future {
		cursor: default;
	}

	.day-cell.outside {
		background: var(--color-bg);
	}

	.day-cell.outside .day-number {
		opacity: 0.3;
	}

	/* Heatmap intensity backgrounds */
	.day-cell.heat-1 {
		background: color-mix(in srgb, var(--color-accent) 6%, var(--color-bg-elevated));
	}

	.day-cell.heat-2 {
		background: color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-elevated));
	}

	.day-cell.heat-3 {
		background: color-mix(in srgb, var(--color-accent) 22%, var(--color-bg-elevated));
	}

	.day-cell.outside.heat-1,
	.day-cell.outside.heat-2,
	.day-cell.outside.heat-3 {
		background: color-mix(in srgb, var(--color-accent) 4%, var(--color-bg));
	}

	.day-number {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		color: var(--color-text);
		line-height: 1;
	}

	.day-cell.today .day-number {
		font-weight: var(--weight-bold);
		color: var(--color-accent);
	}

	.day-cell.has-entry .day-number {
		font-weight: var(--weight-semibold);
	}

	.entry-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--color-accent);
	}

	.entry-count {
		font-family: var(--font-primary);
		font-size: 0.5625rem;
		font-weight: var(--weight-bold);
		color: var(--color-accent);
		line-height: 1;
	}

	.day-cell.outside .entry-dot,
	.day-cell.outside .entry-count {
		opacity: 0.35;
	}

	/* Monthly stats */
	.month-stats {
		display: flex;
		justify-content: space-around;
		padding: 1rem 1.25rem;
		margin-top: 1rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.stat-value {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		line-height: 1;
	}

	.stat-label {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
	}

	/* Loading */
	.calendar-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem 0;
		color: var(--color-text-muted);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
	}

	.calendar-loading p {
		margin: 0;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		opacity: 0.8;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.calendar-footer {
		display: flex;
		justify-content: flex-start;
		padding-top: 2.25rem;
		margin-top: auto;
	}

	@media (max-width: 600px) {
		.calendar-page {
			padding: 1rem;
			padding-top: 0.5rem;
		}

		.day-number {
			font-size: var(--text-xs);
		}

		.streak-bar {
			gap: 1rem;
			padding: 0.75rem 1rem;
		}

		.streak-value {
			font-size: var(--text-xl);
		}

		.month-stats {
			padding: 0.75rem 1rem;
		}
	}

	/* Mode selection modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.15s ease;
		padding: 1rem;
	}

	.modal-content {
		background: var(--color-bg);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		width: 100%;
		max-width: 400px;
		animation: slideUp 0.2s ease;
	}

	.modal-title {
		font-family: var(--font-primary);
		font-size: var(--text-xl);
		font-weight: var(--weight-medium);
		font-stretch: 110%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0 0 0.375rem 0;
		text-align: center;
	}

	.modal-description {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-book);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin: 0 0 1.25rem 0;
		text-align: center;
	}

	.mode-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.mode-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.625rem;
		padding: 1.25rem 1rem;
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.mode-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		text-decoration: none;
	}

	.mode-card:active {
		transform: scale(0.98);
	}

	.mode-card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mode-card-title {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
