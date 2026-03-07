<script lang="ts">
	import { onMount } from 'svelte';
	import Heatmap from './Heatmap.svelte';
	import { Flame, Trophy, TrendingUp, Lightbulb, Calendar } from 'lucide-svelte';

	interface StreakData {
		currentStreak: number;
		longestStreak: number;
		lastEntryDate: string | null;
		lastEntryDaysAgo: number;
	}

	interface Milestone {
		entries: number;
		text: string;
		achieved: boolean;
		emoji: string;
	}

	interface MilestonesResponse {
		achieved: Milestone[];
		nextMilestone: Milestone & { entriesNeeded: number };
		totalEntries: number;
	}

	interface InsightDay {
		day: string;
		emoji: string;
		average: number;
		count: number;
	}

	interface InsightsResponse {
		bestDayOfWeek: InsightDay;
		worstDayOfWeek: InsightDay;
		moodByWeekday: { [key: string]: { average: number; count: number } };
		recurringPatterns: Array<{ pattern: string; frequency: number; type: string }>;
		dataPoints: number;
	}

	let streakData: StreakData | null = null;
	let milestonesData: MilestonesResponse | null = null;
	let insightsData: InsightsResponse | null = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			// Hämta alla data parallellt
			const [streakRes, milestonesRes, insightsRes] = await Promise.all([
				fetch('/api/diary/streak'),
				fetch('/api/diary/milestones'),
				fetch('/api/diary/insights')
			]);

			if (!streakRes.ok) throw new Error('Kunde inte ladda streak');
			if (!milestonesRes.ok) throw new Error('Kunde inte ladda milstolpar');
			if (!insightsRes.ok) throw new Error('Kunde inte ladda insikter');

			streakData = await streakRes.json();
			milestonesData = await milestonesRes.json();
			insightsData = await insightsRes.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ett fel inträffade';
		} finally {
			loading = false;
		}
	});

	function getMoodEmoji(mood: number): string {
		if (mood >= 8) return '😊';
		if (mood >= 6) return '🙂';
		if (mood >= 4) return '😐';
		if (mood >= 2) return '😔';
		return '😢';
	}

	function getTrendEmoji(trend: string): string {
		if (trend === 'improving') return '↗️';
		if (trend === 'declining') return '↘️';
		return '→';
	}
</script>

<div class="journey-container">
	<div class="journey-header">
		<h1>🧭 Min resa</h1>
		<p>Följ din utveckling över tid</p>
	</div>

	{#if loading}
		<div class="loading-state">Laddar din resehistoria...</div>
	{:else if error}
		<div class="error-state">
			<p>⚠️ {error}</p>
			<small>Försök att ladda sidan igen</small>
		</div>
	{:else}
		<!-- STREAK CARD -->
		{#if streakData}
			<section class="card streak-card">
				<div class="card-header">
					<div class="icon-badge">
						<Flame size={24} />
					</div>
					<h2>Din nuvarande streak</h2>
				</div>

				<div class="streak-display">
					<div class="big-number">{streakData.currentStreak}</div>
					<div class="streak-label">dagar i rad</div>
				</div>

				{#if streakData.lastEntryDaysAgo === 0}
					<p class="streak-note">✨ Utmärkt! Du skrev igår</p>
				{:else if streakData.lastEntryDaysAgo === 1}
					<p class="streak-note">📝 Du var här igår – fortsätt idag!</p>
				{:else}
					<p class="streak-note">
						⏳ Senaste inlägg: {streakData.lastEntryDaysAgo} dagar sedan
					</p>
				{/if}

				<div class="streak-meta">
					<small>Din längsta streak: {streakData.longestStreak} dagar</small>
				</div>
			</section>
		{/if}

		<!-- MILESTONES CARD -->
		{#if milestonesData}
			<section class="card milestones-card">
				<div class="card-header">
					<div class="icon-badge trophy">
						<Trophy size={24} />
					</div>
					<h2>Dina milstolpar</h2>
				</div>

				<div class="milestones-grid">
					{#each milestonesData.achieved as milestone}
						<div class="milestone achieved">
							<div class="milestone-emoji">{milestone.emoji}</div>
							<div class="milestone-text">{milestone.text}</div>
						</div>
					{/each}
				</div>

				{#if milestonesData.nextMilestone}
					<div class="next-milestone">
						<div class="next-header">
							<Calendar size={18} />
							<span>Nästa mål</span>
						</div>
						<p>{milestonesData.nextMilestone.text}</p>
						<div class="progress-bar">
							<div
								class="progress-fill"
								style="width: {Math.min(
									100,
									((milestonesData.totalEntries / milestonesData.nextMilestone.entries) *
										100)
								)}%"
							/>
						</div>
						<small>
							{milestonesData.totalEntries} / {milestonesData.nextMilestone.entries}
							({milestonesData.nextMilestone.entriesNeeded} kvar)
						</small>
					</div>
				{/if}
			</section>
		{/if}

		<!-- HEATMAP CARD -->
		<section class="card heatmap-card">
			<div class="card-header">
				<div class="icon-badge heat">
					<TrendingUp size={24} />
				</div>
				<h2>Din aktivitetskarta</h2>
			</div>

			<p class="heatmap-description">
				Varje ruta motsvarar en dag. Mörkare färg = fler inlägg.
			</p>

			<Heatmap />
		</section>

		<!-- INSIGHTS CARD -->
		{#if insightsData && insightsData.dataPoints > 0}
			<section class="card insights-card">
				<div class="card-header">
					<div class="icon-badge insight">
						<Lightbulb size={24} />
					</div>
					<h2>💡 Dina mönster</h2>
				</div>

				<div class="insights-grid">
					<!-- Best day -->
					<div class="insight-item best">
						<div class="insight-emoji">{insightsData.bestDayOfWeek.emoji}</div>
						<div class="insight-content">
							<h3>Mår bäst på</h3>
							<p class="day-name">{insightsData.bestDayOfWeek.day}</p>
							<small>Genomsnitt: {insightsData.bestDayOfWeek.average}/10</small>
						</div>
					</div>

					<!-- Worst day -->
					<div class="insight-item worst">
						<div class="insight-emoji">{insightsData.worstDayOfWeek.emoji}</div>
						<div class="insight-content">
							<h3>Svårare på</h3>
							<p class="day-name">{insightsData.worstDayOfWeek.day}</p>
							<small>Genomsnitt: {insightsData.worstDayOfWeek.average}/10</small>
						</div>
					</div>
				</div>

				<!-- Recurring patterns -->
				{#if insightsData.recurringPatterns.length > 0}
					<div class="patterns-section">
						<h3>🔄 Återkommande mönster</h3>
						<ul class="patterns-list">
							{#each insightsData.recurringPatterns as pattern}
								<li>
									<span class="pattern-text">{pattern.pattern}</span>
									<span class="pattern-badge">{pattern.frequency}x</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</section>
		{/if}

		<!-- Empty state -->
		{#if !streakData || streakData.currentStreak === 0}
			<section class="card empty-state">
				<h2>🌱 Börja din resa</h2>
				<p>
					Skriv ditt första dagboksinlägg för att börja följa din utveckling och få insikter om
					dina mönster.
				</p>
				<a href="/diary" class="btn-primary">Skriv inlägg</a>
			</section>
		{/if}
	{/if}
</div>

<style>
	.journey-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.journey-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.journey-header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: #1a1a1a;
	}

	.journey-header p {
		font-size: 1.1rem;
		color: #666;
	}

	.loading-state,
	.error-state {
		text-align: center;
		padding: 3rem 2rem;
		color: #666;
		font-size: 1.05rem;
	}

	.error-state {
		color: #d32f2f;
		background: #ffebee;
		border-radius: 0.5rem;
		padding: 2rem;
	}

	.error-state small {
		display: block;
		margin-top: 0.5rem;
		color: #c62828;
		font-size: 0.9rem;
	}

	/* CARDS */
	.card {
		background: white;
		border-radius: 0.75rem;
		padding: 2rem;
		margin-bottom: 2rem;
		border: 1px solid #eee;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;
	}

	.card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-color: #ddd;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.card-header h2 {
		font-size: 1.4rem;
		margin: 0;
		color: #1a1a1a;
	}

	.icon-badge {
		width: 3rem;
		height: 3rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.icon-badge {
		background: linear-gradient(135deg, #ff6b6b, #ff8e72);
	}

	.icon-badge.trophy {
		background: linear-gradient(135deg, #ffd93d, #ffb347);
	}

	.icon-badge.heat {
		background: linear-gradient(135deg, #6bcf7f, #4caf50);
	}

	.icon-badge.insight {
		background: linear-gradient(135deg, #667eea, #764ba2);
	}

	/* STREAK */
	.streak-display {
		text-align: center;
		margin: 2rem 0;
	}

	.big-number {
		font-size: 4rem;
		font-weight: 700;
		background: linear-gradient(135deg, #ff6b6b, #ff8e72);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0;
	}

	.streak-label {
		font-size: 1rem;
		color: #666;
		margin-top: 0.5rem;
	}

	.streak-note {
		text-align: center;
		color: #4caf50;
		font-size: 1rem;
		margin: 1rem 0 0 0;
		font-weight: 500;
	}

	.streak-meta {
		text-align: center;
		color: #999;
		margin-top: 1rem;
	}

	/* MILESTONES */
	.milestones-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.milestone {
		padding: 1rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		background: #f5f5f5;
		border: 1px solid #eee;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.milestone.achieved {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(129, 199, 132, 0.1));
		border-color: #4caf50;
	}

	.milestone:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.milestone-emoji {
		font-size: 2rem;
	}

	.milestone-text {
		font-size: 0.9rem;
		font-weight: 500;
		color: #1a1a1a;
	}

	.next-milestone {
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
		border: 1px solid rgba(102, 126, 234, 0.3);
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin-top: 1.5rem;
	}

	.next-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #667eea;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.next-milestone p {
		font-size: 1rem;
		color: #1a1a1a;
		margin: 0.5rem 0 1rem 0;
	}

	.progress-bar {
		height: 0.5rem;
		background: #eee;
		border-radius: 0.25rem;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea, #764ba2);
		border-radius: 0.25rem;
		transition: width 0.3s ease;
	}

	.next-milestone small {
		color: #999;
		display: block;
	}

	/* HEATMAP */
	.heatmap-card {
		overflow-x: auto;
	}

	.heatmap-description {
		color: #666;
		font-size: 0.95rem;
		margin: 0 0 1.5rem 0;
	}

	/* INSIGHTS */
	.insights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.insight-item {
		padding: 1.5rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid #eee;
		transition: all 0.2s ease;
	}

	.insight-item.best {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(129, 199, 132, 0.1));
		border-color: #4caf50;
	}

	.insight-item.worst {
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 114, 0.1));
		border-color: #ff6b6b;
	}

	.insight-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.insight-emoji {
		font-size: 2rem;
		min-width: 3rem;
	}

	.insight-content h3 {
		margin: 0 0 0.25rem 0;
		font-size: 0.9rem;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.day-name {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.insight-content small {
		color: #999;
		font-size: 0.85rem;
	}

	.patterns-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #eee;
	}

	.patterns-section h3 {
		margin: 0 0 1rem 0;
		color: #1a1a1a;
	}

	.patterns-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.patterns-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background: #f9f9f9;
		border-radius: 0.25rem;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.pattern-text {
		color: #1a1a1a;
		font-weight: 500;
	}

	.pattern-badge {
		background: #667eea;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	/* EMPTY STATE */
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(129, 199, 132, 0.05));
		border: 2px dashed #4caf50;
	}

	.empty-state h2 {
		margin-top: 0;
		color: #2e7d32;
	}

	.empty-state p {
		color: #555;
		margin: 1rem 0 1.5rem 0;
	}

	.btn-primary {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #4caf50, #45a049);
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
	}

	/* RESPONSIV */
	@media (max-width: 640px) {
		.journey-container {
			padding: 1rem;
		}

		.journey-header h1 {
			font-size: 1.8rem;
		}

		.card {
			padding: 1.5rem;
			margin-bottom: 1.5rem;
		}

		.card-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.milestones-grid {
			grid-template-columns: 1fr;
		}

		.insights-grid {
			grid-template-columns: 1fr;
		}

		.big-number {
			font-size: 3rem;
		}

		.icon-badge {
			width: 2.5rem;
			height: 2.5rem;
		}
	}
</style>
