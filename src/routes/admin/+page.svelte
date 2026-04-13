<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	type TabId = 'prompts' | 'pages' | 'ab';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeTab = $state<TabId>('prompts');
	let pendingForm = $state<string | null>(null);

	$effect(() => {
		activeTab = (form?.activeTab as TabId | undefined) ?? activeTab;
	});

	function enhanceForm(formKey: string, tab: TabId) {
		return () => {
			pendingForm = formKey;
			activeTab = tab;

			return async ({ update }: { update: () => Promise<void> }) => {
				await update();
				pendingForm = null;
			};
		};
	}

	function conversionRate(conversions: number | null | undefined, views: number | null | undefined) {
		const safeConversions = conversions ?? 0;
		const safeViews = views ?? 0;

		if (safeViews <= 0) return '0 %';

		return `${((safeConversions / safeViews) * 100).toFixed(1)} %`;
	}

	function formatDate(value: string | null | undefined) {
		if (!value) return '-';

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '-';

		return new Intl.DateTimeFormat('sv-SE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(date);
	}

	function truncate(value: string | null | undefined, maxLength: number) {
		const text = value?.trim() ?? '';
		if (text.length <= maxLength) return text;

		return `${text.slice(0, maxLength).trimEnd()}…`;
	}
</script>

<SEO canonical="https://www.mittpsyke.se/admin" />

<svelte:head>
	<title>Admin och SEO | MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<header class="hero">
		<div>
			<p class="eyebrow">MittPsyke Admin</p>
			<h1>Landningssidor, SEO och A/B-test</h1>
			<p class="intro">
				Här kan du skapa lugna landningssidor, generera svensk SEO-copy och följa vilka
				varianter som faktiskt hjälper besökare vidare.
			</p>
		</div>
		<div class="hero-note">
			<p>Datat kommer från Supabase och analytics kan uppdatera visningar och konverteringar automatiskt när SQL-funktionen är installerad.</p>
		</div>
	</header>

	<section class="stats-grid" aria-label="Översikt">
		<article class="stat-card">
			<span>Landningssidor</span>
			<strong>{data.stats.pageCount}</strong>
			<small>{data.stats.publishedCount} publicerade</small>
		</article>
		<article class="stat-card">
			<span>SEO-förslag</span>
			<strong>{data.stats.promptCount}</strong>
			<small>senaste sparade förslagen</small>
		</article>
		<article class="stat-card">
			<span>A/B-test</span>
			<strong>{data.stats.activeTestCount}</strong>
			<small>aktiva just nu</small>
		</article>
		<article class="stat-card">
			<span>Total konverteringsgrad</span>
			<strong>{conversionRate(data.stats.totalConversions, data.stats.totalViews)}</strong>
			<small>{data.stats.totalConversions} av {data.stats.totalViews} visningar</small>
		</article>
	</section>

	<section class="panel stack-lg">
		<div class="panel-header">
			<h2>Feedback</h2>
			<p>Senaste inskickade svaren från feedbacksidan.</p>
		</div>

		{#if data.feedbackSubmissions.length === 0}
			<p class="empty">Ingen feedback har kommit in ännu.</p>
		{:else}
			<div class="stack">
				{#each data.feedbackSubmissions as submission}
					<article class="prompt-card">
						<div class="prompt-meta">
							<span>{formatDate(submission.created_at)}</span>
							<span>{submission.user_id ? 'Inloggad användare' : 'Anonym / utloggad'}</span>
						</div>
						<div class="feedback-meta-grid">
							<div>
								<span>Upplevelse</span>
								<strong>{submission.experience}</strong>
							</div>
							<div>
								<span>Använda igen</span>
								<strong>{submission.use_again}</strong>
							</div>
						</div>

						{#if submission.what_worked}
							<p><strong>Fungerade bra:</strong> {truncate(submission.what_worked, 220)}</p>
						{/if}
						{#if submission.unclear}
							<p><strong>Otydligt eller svårt:</strong> {truncate(submission.unclear, 220)}</p>
						{/if}
						{#if submission.missing}
							<p><strong>Saknar:</strong> {truncate(submission.missing, 220)}</p>
						{/if}
						{#if submission.other}
							<p><strong>Övrigt:</strong> {truncate(submission.other, 220)}</p>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<div class="tab-bar" role="tablist" aria-label="Admin-flikar">
		<button
			type="button"
			role="tab"
			class:active={activeTab === 'prompts'}
			aria-selected={activeTab === 'prompts'}
			onclick={() => (activeTab = 'prompts')}
		>
			Prompt-generator
		</button>
		<button
			type="button"
			role="tab"
			class:active={activeTab === 'pages'}
			aria-selected={activeTab === 'pages'}
			onclick={() => (activeTab = 'pages')}
		>
			Landningssidor
		</button>
		<button
			type="button"
			role="tab"
			class:active={activeTab === 'ab'}
			aria-selected={activeTab === 'ab'}
			onclick={() => (activeTab = 'ab')}
		>
			A/B-testing
		</button>
	</div>

	{#if form?.error}
		<p class="message error" role="alert">{form.error}</p>
	{/if}

	{#if form?.success}
		<p class="message success" role="status">{form.success}</p>
	{/if}

	{#if data.schemaError}
		<section class="schema-warning">
			<h2>Schema saknas</h2>
			<p>{data.schemaError}</p>
		</section>
	{/if}

	{#if activeTab === 'prompts'}
		<section class="panel-grid">
			<form
				method="POST"
				action="?/generatePrompt"
				use:enhance={enhanceForm('generatePrompt', 'prompts')}
				class="panel generator-panel"
			>
				<div class="panel-header">
					<h2>Generera SEO-förslag</h2>
					<p>Skapa titel, meta, rubrik eller CTA med Claude och spara allt direkt i Supabase.</p>
				</div>

				<label>
					<span>Landningssida</span>
					<select name="landingPageId" required>
						<option value="">Välj sida</option>
						{#each data.landingPages as page}
							<option value={page.id}>{page.name} ({page.slug})</option>
						{/each}
					</select>
				</label>

				<label>
					<span>Typ av förslag</span>
					<select name="promptType" required>
						<option value="">Välj typ</option>
						{#each data.seoPromptTypes as promptType}
							<option value={promptType}>{promptType}</option>
						{/each}
					</select>
				</label>

				<label>
					<span>Fokus eller brief</span>
					<textarea
						name="context"
						rows="5"
						placeholder="Exempel: fokusera på låg tröskel, enkel svenska och sökord kring ångesthjälp."
					></textarea>
				</label>

				<button type="submit" class="primary" disabled={pendingForm === 'generatePrompt'}>
					{pendingForm === 'generatePrompt' ? 'Genererar…' : 'Generera förslag'}
				</button>

				{#if form?.generatedPrompt}
					<div class="generated-output">
						<h3>Senast genererat</h3>
						<p>{form.generatedPrompt}</p>
					</div>
				{/if}
			</form>

			<section class="panel prompt-list-panel">
				<div class="panel-header">
					<h2>Senaste sparade förslag</h2>
					<p>Överblick över vad som redan har tagits fram för varje sida.</p>
				</div>

				{#if data.seoPrompts.length === 0}
					<p class="empty">Inga promptförslag finns sparade än.</p>
				{:else}
					<div class="stack">
						{#each data.seoPrompts as prompt}
							<article class="prompt-card">
								<div class="prompt-meta">
									<span>{prompt.landing_page_name}</span>
									<span>{prompt.prompt_type}</span>
									<time datetime={prompt.created_at ?? undefined}>{formatDate(prompt.created_at)}</time>
								</div>
								<p>{truncate(prompt.generated_content, 260)}</p>
							</article>
						{/each}
					</div>
				{/if}
			</section>
		</section>
	{/if}

	{#if activeTab === 'pages'}
		<section class="panel stack-lg">
			<div class="panel-header">
				<h2>Skapa ny landningssida</h2>
				<p>Varje sida får en post i `landing_pages` och ett första innehållsblock i `landing_page_content`.</p>
			</div>

			<form
				method="POST"
				action="?/addLandingPage"
				use:enhance={enhanceForm('addLandingPage', 'pages')}
				class="create-grid"
			>
				<label>
					<span>Namn</span>
					<input type="text" name="name" placeholder="Ångest" required />
				</label>
				<label>
					<span>Page ID</span>
					<input type="text" name="pageId" placeholder="angst" required />
				</label>
				<label>
					<span>Slug</span>
					<input type="text" name="slug" placeholder="/angest" required />
				</label>
				<label>
					<span>Status</span>
					<select name="status">
						{#each data.landingPageStatuses as status}
							<option value={status}>{status}</option>
						{/each}
					</select>
				</label>
				<label class="full-span">
					<span>Kort beskrivning</span>
					<textarea
						name="description"
						rows="3"
						placeholder="Kort förklaring av sidans syfte och vad besökaren ska få hjälp med."
					></textarea>
				</label>
				<button type="submit" class="primary fit" disabled={pendingForm === 'addLandingPage'}>
					{pendingForm === 'addLandingPage' ? 'Skapar…' : 'Skapa sida'}
				</button>
			</form>
		</section>

		<section class="stack-lg">
			{#if data.landingPages.length === 0}
				<section class="panel">
					<p class="empty">Det finns inga landningssidor än.</p>
				</section>
			{:else}
				{#each data.landingPages as page}
					<article class="panel page-card">
						<div class="page-top">
							<div>
								<p class="page-kicker">{page.page_id}</p>
								<h2>{page.name}</h2>
								<p class="page-description">{page.description ?? 'Ingen beskrivning sparad än.'}</p>
							</div>
							<div class="page-metrics">
								<div>
									<span>Visningar</span>
									<strong>{page.views}</strong>
								</div>
								<div>
									<span>Konverteringar</span>
									<strong>{page.conversions}</strong>
								</div>
								<div>
									<span>Slug</span>
									<strong>{page.slug}</strong>
								</div>
							</div>
						</div>

						<div class="action-row">
							<form
								method="POST"
								action="?/updatePageStatus"
								use:enhance={enhanceForm(`status-${page.id}`, 'pages')}
								class="inline-form"
							>
								<input type="hidden" name="landingPageId" value={page.id} />
								<select name="status">
									{#each data.landingPageStatuses as status}
										<option value={status} selected={status === page.status}>{status}</option>
									{/each}
								</select>
								<button type="submit" disabled={pendingForm === `status-${page.id}`}>Spara status</button>
							</form>

							<form
								method="POST"
								action="?/deleteLandingPage"
								use:enhance={enhanceForm(`delete-${page.id}`, 'pages')}
								class="inline-form danger"
							>
								<input type="hidden" name="landingPageId" value={page.id} />
								<button type="submit" disabled={pendingForm === `delete-${page.id}`}>Radera sida</button>
							</form>
						</div>

						<form
							method="POST"
							action="?/saveLandingPageContent"
							use:enhance={enhanceForm(`content-${page.id}`, 'pages')}
							class="content-grid"
						>
							<input type="hidden" name="landingPageId" value={page.id} />

							<label>
								<span>SEO-titel</span>
								<input
									type="text"
									name="seoTitle"
									value={page.content?.seo_title ?? ''}
									placeholder="Hjälp vid ångest | MittPsyke"
								/>
							</label>

							<label>
								<span>H1</span>
								<input
									type="text"
									name="h1Heading"
									value={page.content?.h1_heading ?? ''}
									placeholder="Hjälp vid ångest i din egen takt"
								/>
							</label>

							<label class="full-span">
								<span>Meta-beskrivning</span>
								<textarea
									name="seoMeta"
									rows="3"
									placeholder="Kort meta-beskrivning som känns lugn, tydlig och relevant."
								>{page.content?.seo_meta ?? ''}</textarea>
							</label>

							<label>
								<span>CTA-text</span>
								<input
									type="text"
									name="ctaText"
									value={page.content?.cta_text ?? ''}
									placeholder="Starta ett lugnt samtal"
								/>
							</label>

							<label>
								<span>Nyckelord</span>
								<input
									type="text"
									name="keywords"
									value={page.content?.keywords ?? ''}
									placeholder="ångest, stöd online, prata anonymt"
								/>
							</label>

							<label class="full-span">
								<span>Huvudinnehåll (HTML)</span>
								<textarea
									name="htmlContent"
									rows="8"
									placeholder="<p>Beskriv innehållet här.</p>"
								>{page.content?.html_content ?? ''}</textarea>
							</label>

							<button type="submit" class="primary fit" disabled={pendingForm === `content-${page.id}`}>
								{pendingForm === `content-${page.id}` ? 'Sparar…' : 'Spara innehåll'}
							</button>
						</form>
					</article>
				{/each}
			{/if}
		</section>
	{/if}

	{#if activeTab === 'ab'}
		<section class="panel stack-lg">
			<div class="panel-header">
				<h2>Skapa nytt A/B-test</h2>
				<p>Använd testet för att jämföra två rubriker eller CTA-varianter på samma landningssida.</p>
			</div>

			<form
				method="POST"
				action="?/updateABTest"
				use:enhance={enhanceForm('create-ab', 'ab')}
				class="create-grid"
			>
				<label>
					<span>Landningssida</span>
					<select name="landingPageId" required>
						<option value="">Välj sida</option>
						{#each data.landingPages as page}
							<option value={page.id}>{page.name}</option>
						{/each}
					</select>
				</label>
				<label>
					<span>Variant A</span>
					<input type="text" name="variantAName" placeholder="Starta ett samtal" required />
				</label>
				<label>
					<span>Variant B</span>
					<input type="text" name="variantBName" placeholder="Prata lugnt med stöd" required />
				</label>
				<input type="hidden" name="conversionsA" value="0" />
				<input type="hidden" name="conversionsB" value="0" />
				<input type="hidden" name="viewsA" value="0" />
				<input type="hidden" name="viewsB" value="0" />
				<input type="hidden" name="isActive" value="true" />
				<button type="submit" class="primary fit" disabled={pendingForm === 'create-ab'}>
					{pendingForm === 'create-ab' ? 'Skapar…' : 'Skapa test'}
				</button>
			</form>
		</section>

		<section class="stack-lg">
			{#if data.abTests.length === 0}
				<section class="panel">
					<p class="empty">Det finns inga A/B-test än.</p>
				</section>
			{:else}
				{#each data.abTests as test}
					<article class="panel ab-card">
						<div class="page-top">
							<div>
								<p class="page-kicker">{test.landing_page_name}</p>
								<h2>{test.variant_a_name ?? 'Variant A'} vs {test.variant_b_name ?? 'Variant B'}</h2>
								<p class="page-description">
									Status: {test.is_active ? 'aktivt' : 'avslutat'}
									{#if test.winner}
										· Vinnare: {test.winner}
									{/if}
								</p>
							</div>
							<div class="page-metrics">
								<div>
									<span>Rate A</span>
									<strong>{conversionRate(test.conversions_a, test.views_a)}</strong>
								</div>
								<div>
									<span>Rate B</span>
									<strong>{conversionRate(test.conversions_b, test.views_b)}</strong>
								</div>
								<div>
									<span>Uppdaterad</span>
									<strong>{formatDate(test.updated_at)}</strong>
								</div>
							</div>
						</div>

						<form
							method="POST"
							action="?/updateABTest"
							use:enhance={enhanceForm(`ab-${test.id}`, 'ab')}
							class="content-grid"
						>
							<input type="hidden" name="abTestId" value={test.id} />
							<input type="hidden" name="landingPageId" value={test.landing_page_id} />

							<label>
								<span>Variant A</span>
								<input type="text" name="variantAName" value={test.variant_a_name ?? ''} required />
							</label>
							<label>
								<span>Variant B</span>
								<input type="text" name="variantBName" value={test.variant_b_name ?? ''} required />
							</label>
							<label>
								<span>Visningar A</span>
								<input type="number" min="0" name="viewsA" value={test.views_a} />
							</label>
							<label>
								<span>Visningar B</span>
								<input type="number" min="0" name="viewsB" value={test.views_b} />
							</label>
							<label>
								<span>Konverteringar A</span>
								<input type="number" min="0" name="conversionsA" value={test.conversions_a} />
							</label>
							<label>
								<span>Konverteringar B</span>
								<input type="number" min="0" name="conversionsB" value={test.conversions_b} />
							</label>
							<label>
								<span>Aktivt</span>
								<select name="isActive">
									<option value="true" selected={test.is_active}>Ja</option>
									<option value="false" selected={!test.is_active}>Nej</option>
								</select>
							</label>
							<button type="submit" class="primary fit" disabled={pendingForm === `ab-${test.id}`}>
								{pendingForm === `ab-${test.id}` ? 'Sparar…' : 'Spara test'}
							</button>
						</form>

						<form
							method="POST"
							action="?/calculateWinner"
							use:enhance={enhanceForm(`winner-${test.id}`, 'ab')}
							class="inline-form"
						>
							<input type="hidden" name="abTestId" value={test.id} />
							<button type="submit" disabled={pendingForm === `winner-${test.id}`}>
								{pendingForm === `winner-${test.id}` ? 'Räknar…' : 'Beräkna vinnare'}
							</button>
						</form>
					</article>
				{/each}
			{/if}
		</section>
	{/if}

</div>

<style>
	.admin-shell {
		max-width: 1180px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
		display: grid;
		gap: 1.35rem;
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
		gap: 1rem;
		align-items: stretch;
	}

	.hero,
	.panel,
	.schema-warning,
	.stat-card {
		background:
			radial-gradient(circle at top right, rgba(96, 165, 250, 0.18), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		border: 1px solid rgba(148, 163, 184, 0.18);
		border-radius: 24px;
		color: #e2e8f0;
		box-shadow: 0 16px 40px rgba(2, 6, 23, 0.28);
	}

	.hero {
		padding: 1.4rem;
	}

	.eyebrow {
		margin: 0 0 0.45rem;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: #93c5fd;
	}

	h1,
	h2,
	h3 {
		margin: 0;
		color: #f8fafc;
	}

	h1 {
		font-size: clamp(1.9rem, 1.4rem + 1.8vw, 2.7rem);
		line-height: 1.02;
	}

	.intro,
	.hero-note p,
	.panel-header p,
	.page-description,
	.prompt-card p {
		color: rgba(226, 232, 240, 0.82);
	}

	.intro {
		max-width: 64ch;
		margin-top: 0.7rem;
	}

	.hero-note {
		padding: 1rem;
		border-radius: 18px;
		background: rgba(15, 23, 42, 0.58);
		border: 1px solid rgba(96, 165, 250, 0.2);
		align-self: stretch;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.9rem;
	}

	.stat-card {
		padding: 1rem 1.1rem;
	}

	.stat-card span,
	label span,
	.page-kicker,
	.prompt-meta,
	.page-metrics span {
		display: block;
		font-size: 0.78rem;
		letter-spacing: 0.04em;
		color: #93c5fd;
	}

	.stat-card strong,
	.page-metrics strong {
		display: block;
		margin-top: 0.3rem;
		font-size: 1.5rem;
		color: #fff;
	}

	.stat-card small {
		display: block;
		margin-top: 0.35rem;
		color: rgba(226, 232, 240, 0.68);
	}

	.tab-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tab-bar button,
	button,
	select,
	input,
	textarea {
		border-radius: 14px;
	}

	.tab-bar button {
		border: 1px solid rgba(148, 163, 184, 0.2);
		background: rgba(15, 23, 42, 0.84);
		color: rgba(226, 232, 240, 0.76);
		padding: 0.7rem 1rem;
		cursor: pointer;
		transition: 160ms ease;
	}

	.tab-bar button.active,
	.tab-bar button:hover {
		color: #fff;
		border-color: rgba(96, 165, 250, 0.45);
		background: linear-gradient(135deg, rgba(37, 99, 235, 0.28), rgba(76, 29, 149, 0.25));
	}

	.message {
		margin: 0;
		padding: 0.85rem 1rem;
		border-radius: 16px;
		font-size: 0.94rem;
	}

	.message.success {
		background: rgba(34, 197, 94, 0.12);
		color: #dcfce7;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.message.error {
		background: rgba(248, 113, 113, 0.12);
		color: #fee2e2;
		border: 1px solid rgba(248, 113, 113, 0.28);
	}

	.schema-warning {
		padding: 1rem 1.15rem;
	}

	.panel,
	.schema-warning {
		padding: 1.15rem;
	}

	.panel-grid {
		display: grid;
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
		gap: 1rem;
	}

	.stack,
	.stack-lg,
	.content-grid,
	.create-grid {
		display: grid;
		gap: 0.9rem;
	}

	.stack-lg {
		gap: 1rem;
	}

	.panel-header {
		display: grid;
		gap: 0.2rem;
		margin-bottom: 0.65rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
	}

	input,
	select,
	textarea {
		width: 100%;
		border: 1px solid rgba(148, 163, 184, 0.22);
		background: rgba(15, 23, 42, 0.72);
		color: #f8fafc;
		padding: 0.8rem 0.9rem;
	}

	textarea {
		resize: vertical;
		min-height: 7rem;
	}

	button {
		border: 1px solid rgba(148, 163, 184, 0.2);
		background: rgba(15, 23, 42, 0.72);
		color: #fff;
		padding: 0.78rem 1rem;
		cursor: pointer;
		transition: 160ms ease;
	}

	button:hover:not(:disabled) {
		border-color: rgba(96, 165, 250, 0.5);
		transform: translateY(-1px);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.primary {
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		border-color: rgba(191, 219, 254, 0.38);
	}

	.fit {
		width: fit-content;
	}

	.generated-output,
	.prompt-card,
	.hero-note {
		border-radius: 18px;
	}

	.generated-output,
	.prompt-card {
		border: 1px solid rgba(148, 163, 184, 0.18);
		background: rgba(15, 23, 42, 0.56);
		padding: 0.9rem;
	}

	.prompt-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.7rem;
		align-items: center;
	}

	.prompt-meta span + span {
		color: rgba(226, 232, 240, 0.62);
	}

	.prompt-meta time {
		margin-left: auto;
		font-size: 0.78rem;
		color: rgba(226, 232, 240, 0.52);
	}

	.feedback-meta-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 0.8rem;
		margin-bottom: 0.8rem;
	}

	.feedback-meta-grid strong {
		display: block;
		margin-top: 0.3rem;
		font-size: 1rem;
		color: #fff;
	}

	.empty {
		margin: 0;
		color: rgba(226, 232, 240, 0.66);
	}

	.create-grid,
	.content-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.full-span {
		grid-column: 1 / -1;
	}

	.page-card,
	.ab-card {
		display: grid;
		gap: 1rem;
	}

	.page-top {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1rem;
	}

	.page-kicker {
		margin-bottom: 0.35rem;
	}

	.page-metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(90px, 1fr));
		gap: 0.75rem;
		min-width: min(340px, 100%);
	}

	.action-row,
	.inline-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		align-items: center;
	}

	.inline-form select {
		min-width: 160px;
	}

	.inline-form.danger button {
		background: rgba(127, 29, 29, 0.7);
		border-color: rgba(248, 113, 113, 0.28);
		color: #fee2e2;
	}

	@media (max-width: 960px) {
		.hero,
		.panel-grid,
		.page-top {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.page-metrics {
			min-width: 0;
		}
	}

	@media (max-width: 700px) {
		.admin-shell {
			padding-inline: 0.8rem;
		}

		.stats-grid,
		.create-grid,
		.content-grid,
		.feedback-meta-grid {
			grid-template-columns: 1fr;
		}

		.fit,
		button {
			width: 100%;
		}

		.inline-form {
			width: 100%;
		}

		.inline-form select {
			min-width: 0;
		}
	}
</style>

