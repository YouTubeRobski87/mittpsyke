<script lang="ts">
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';

	let showSharePlaceholder = false;
</script>

<main class="auth-page">
	<PortalSubnav
		active="gemenskap"
		title="Du är inte ensam"
		description="En lugn plats där du kan dela tankar anonymt, känna igen dig i andra och ge eller få mjuk bekräftelse."
	/>

	<div class="auth-shell community-page">
		<section class="auth-panel auth-panel-accent info-panel" aria-label="Viktig information">
			<h2>Innan du delar</h2>
			<ul>
				<li>Det du delar här ska vara anonymt.</li>
				<li>Skriv inte ut namn, personnummer, adresser eller andra personuppgifter.</li>
				<li>Gemenskapen är ett stöd mellan människor, inte vård eller akut hjälp.</li>
				<li>Vid akut fara: ring 112 eller kontakta 1177.</li>
			</ul>
		</section>

		<section class="auth-panel empty-panel">
			<h2>Här kommer gemenskapens inlägg att visas</h2>
			<p>
				Här kan anonyma delningar från användare samlas i lugn takt. Du kommer senare kunna dela en
				egen tanke eller välja att dela ett dagboksinlägg anonymt.
			</p>

			<div class="empty-actions">
				<button type="button" class="auth-button primary" onclick={() => (showSharePlaceholder = true)}>
					Dela en tanke
				</button>
				<a href="/dagbok" class="auth-button">Öppna dagboken</a>
			</div>

			{#if showSharePlaceholder}
				<div class="placeholder-note" role="status">
					Funktionen för att dela en anonym tanke kommer i nästa steg. Tills vidare kan du skriva i
					dagboken och återkomma hit.
				</div>
			{/if}
		</section>

		<section class="auth-panel future-panel">
			<h2>Kommer i nästa steg</h2>
			<div class="future-list" role="list">
				<p role="listitem">Dela anonymt från dagboken</p>
				<p role="listitem">Mjuka stödreaktioner</p>
				<p role="listitem">Korta anonyma svar</p>
				<p role="listitem">Rapportera innehåll</p>
			</div>
		</section>

		<section class="auth-panel sample-panel">
			<h2>Exempel från gemenskapen</h2>
			<div class="sample-list">
				<article class="sample-card">
					<p class="sample-label">Anonym röst</p>
					<p>“Idag känns allt lite tyngre än vanligt, men jag försöker ta en stund i taget.”</p>
				</article>
				<article class="sample-card">
					<p class="sample-label">Anonym röst</p>
					<p>“Jag vet inte riktigt vad jag känner, men det hjälpte att bara skriva ner något.”</p>
				</article>
			</div>
		</section>
	</div>
</main>

<style>
	.community-page {
		padding-top: 0.2rem;
		gap: 0.9rem;
	}

	.info-panel h2,
	.empty-panel h2,
	.future-panel h2,
	.sample-panel h2 {
		margin: 0;
		font-size: 1.03rem;
	}

	.info-panel ul {
		margin: 0.7rem 0 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.4rem;
	}

	.info-panel li {
		color: hsl(var(--foreground));
	}

	.empty-panel p {
		margin: 0.55rem 0 0;
		color: hsl(var(--muted-foreground));
		max-width: 66ch;
	}

	.empty-actions {
		margin-top: 1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.placeholder-note {
		margin-top: 0.75rem;
		padding: 0.7rem 0.8rem;
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
		border: 1px solid hsl(var(--border));
		color: hsl(var(--muted-foreground));
		font-size: 0.9rem;
	}

	.future-list {
		margin-top: 0.75rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 0.55rem;
	}

	.future-list p {
		margin: 0;
		padding: 0.65rem 0.7rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
		color: hsl(var(--foreground));
		font-size: 0.9rem;
	}

	.sample-list {
		margin-top: 0.75rem;
		display: grid;
		gap: 0.6rem;
	}

	.sample-card {
		padding: 0.75rem 0.8rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
	}

	.sample-card p {
		margin: 0;
	}

	.sample-label {
		font-size: 0.8rem;
		color: hsl(var(--muted-foreground));
	}

	.sample-card p:last-child {
		margin-top: 0.35rem;
		color: hsl(var(--foreground));
		line-height: 1.6;
	}
</style>
