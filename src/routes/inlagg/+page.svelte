<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import type { InlaggEntry } from './+page.server';

	type PageData = {
		entries: InlaggEntry[];
		page: number;
		totalPages: number;
		total: number;
	};

	let { data } = $props<{ data: PageData }>();
</script>

<div class="mp-dashboard">
	<div class="shell">
		<Sidebar active="inlagg" />

		<main class="main">
			<header class="page-header">
				<div>
					<div class="kicker">Dina anteckningar</div>
					<h1>Inlägg</h1>
					<p class="lead">{data.total} sparade dagboksrader</p>
				</div>
				<a href="/dagbok/checkin#skriv-sjalv" class="btn btn-primary">+ Nytt inlägg</a>
			</header>

			{#if data.entries.length === 0}
				<div class="empty">
					<p>Du har inga inlägg än. Skriv ditt första avtryck.</p>
					<a href="/dagbok/checkin#skriv-sjalv" class="btn btn-primary">Börja skriva</a>
				</div>
			{:else}
				<section class="entry-list">
					{#each data.entries as entry (entry.id)}
						<a href="/dagbok/checkin?entry={entry.id}" class="entry-link">
							<EntryCard
								title={entry.title}
								body={entry.snippet}
								time={entry.date}
								tag={entry.tag}
							/>
						</a>
					{/each}
				</section>

				{#if data.totalPages > 1}
					<nav class="pagination" aria-label="Sidor">
						{#if data.page > 1}
							<a href="?page={data.page - 1}" class="btn btn-ghost">← Föregående</a>
						{/if}
						<span class="page-info">Sida {data.page} av {data.totalPages}</span>
						{#if data.page < data.totalPages}
							<a href="?page={data.page + 1}" class="btn btn-ghost">Nästa →</a>
						{/if}
					</nav>
				{/if}
			{/if}
		</main>
	</div>
</div>

<style>
	.mp-dashboard {
		--mp-lila: #a882ff;
		--mp-lila-2: #7c5cff;
		--mp-card: rgba(255, 255, 255, 0.04);
		--mp-card-border: rgba(168, 130, 255, 0.14);
		--mp-text: #e8e6f0;
		--mp-text-dim: #9a98ad;
		--mp-radius: 18px;

		color: var(--mp-text);
		min-height: 100vh;
		padding: 28px;
		background:
			radial-gradient(1200px 600px at 80% -10%, rgba(124, 92, 255, 0.18), transparent 60%),
			radial-gradient(900px 500px at 10% 110%, rgba(168, 130, 255, 0.14), transparent 55%),
			linear-gradient(160deg, #0a0a14, #11101f 60%, #0d0b1a);
	}

	.shell {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 248px 1fr;
		gap: 24px;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	/* ── Header ── */
	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		background: var(--mp-card);
		border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius);
		padding: 26px 28px;
		backdrop-filter: blur(14px);
	}
	.kicker {
		font-size: 0.76rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--mp-lila);
		margin-bottom: 4px;
	}
	.page-header h1 {
		font-size: 1.7rem;
		margin: 0 0 4px;
		font-weight: 700;
	}
	.lead {
		font-size: 0.88rem;
		color: var(--mp-text-dim);
		margin: 0;
	}

	/* ── Knappar ── */
	.btn {
		display: inline-flex;
		align-items: center;
		padding: 10px 18px;
		border-radius: 11px;
		font-size: 0.88rem;
		font-weight: 600;
		text-decoration: none;
		border: none;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-primary {
		background: linear-gradient(135deg, var(--mp-lila-2), var(--mp-lila));
		color: #fff;
	}
	.btn-ghost {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--mp-card-border);
		color: var(--mp-text);
	}
	.btn-ghost:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	/* ── Inläggslista ── */
	.entry-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.entry-link {
		text-decoration: none;
		display: block;
		transition: transform 0.12s;
	}
	.entry-link:hover {
		transform: translateY(-1px);
	}

	/* ── Tom sida ── */
	.empty {
		background: var(--mp-card);
		border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius);
		padding: 48px 32px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}
	.empty p {
		color: var(--mp-text-dim);
		margin: 0;
	}

	/* ── Paginering ── */
	.pagination {
		display: flex;
		align-items: center;
		gap: 14px;
		justify-content: center;
		padding: 8px 0;
	}
	.page-info {
		font-size: 0.84rem;
		color: var(--mp-text-dim);
	}

	@media (max-width: 880px) {
		.shell {
			grid-template-columns: 1fr;
		}
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
