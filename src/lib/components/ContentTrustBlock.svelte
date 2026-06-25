<script lang="ts">
	import type { SourceItem } from '$lib/seo-kit/content';

	type Props = {
		updatedAt?: string;
		sources?: SourceItem[];
		excludeReferenceLabels?: string[];
		showEmergencyNote?: boolean;
		showSupportLinks?: boolean;
		contentLinkHref?: string;
	};

	let {
		updatedAt,
		sources = [],
		excludeReferenceLabels = [],
		showEmergencyNote = false,
		showSupportLinks = false,
		contentLinkHref = '/sa-arbetar-vi-med-innehall'
	}: Props = $props();

	const requiredReferences: SourceItem[] = [
		{
			label: 'Socialtjänstlagen (2001:453)',
			url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/socialtjanstlag-2001453_sfs-2001-453/'
		},
		{
			label: 'LVM (1988:870)',
			url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1988870-om-vard-av-missbrukare-i-vissa_sfs-1988-870/'
		},
		{
			label: 'Socialstyrelsen riktlinjer',
			url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/regler-och-riktlinjer/'
		}
	];

	const references = $derived.by(() => {
		const seen = new Set<string>();
		const excluded = new Set(excludeReferenceLabels.map((label) => label.toLowerCase()));
		return [...sources, ...requiredReferences].filter((source) => {
			const key = source.label.toLowerCase();
			if (excluded.has(key)) return false;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	});

	function formatDate(iso: string): string {
		const formatter = new Intl.DateTimeFormat('sv-SE', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});

		return formatter.format(new Date(`${iso}T00:00:00`));
	}
</script>

<section class="trust-block" aria-label="Källor och kvalitet">
	{#if updatedAt}
		<p class="meta">Senast uppdaterad: {formatDate(updatedAt)}</p>
	{/if}

	<h2>Källor och kvalitet</h2>
	<p class="note">
		Innehållet på denna sida är sammanställt utifrån information från 1177,
		Folkhälsomyndigheten, Socialstyrelsen och andra offentliga kunskapskällor.
	</p>

	{#if references.length}
		<h3>Referenser</h3>
		<ul>
			{#each references as source}
				<li>
					<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="note">
		MittPsyke är ett stöd för reflektion och återhämtning i vardagen och ersätter inte professionell
		vård, diagnos eller behandling.
	</p>

	{#if showEmergencyNote}
		<p class="note emergency">
			Vid akut fara, ring <a href="tel:112">112</a>. För vårdråd, kontakta
			<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>.
		</p>
	{/if}

	{#if showSupportLinks}
		<p class="note">
			Om du vill fortsätta i egen takt kan du <a href="/dagbok">skriva i dagboken</a> eller
			<a href="/ovningar">prova en övning</a>.
		</p>
	{/if}

	<div class="help-box" aria-label="Vidare hjälp och kontakt">
		<p class="help-title">Vidare hjälp</p>
		<p class="note">
			Om du behöver medicinsk bedömning eller mer stöd än egenvård: kontakta
			<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>.
			För stödlinjer finns
			<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer.se</a>.
		</p>
		<p class="note">
			Läs mer om avgränsningar i <a href="/ansvar">ansvarsinfo</a> och hur data hanteras i
			<a href="/integritet">integritetspolicyn</a>.
		</p>
	</div>

	<p class="more">
		<a href={contentLinkHref}>Läs mer om hur vi arbetar med innehåll</a>
	</p>
</section>

<style>
	.trust-block {
		margin-top: clamp(2rem, 4vw, 3rem);
		padding: 1.1rem 0 0;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.meta {
		margin: 0 0 0.55rem;
		font-size: 0.82rem;
		line-height: 1.5;
		color: rgba(0, 0, 0, 0.58);
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	h3 {
		margin: 1rem 0 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	ul {
		margin: 0.6rem 0 0;
		padding-left: 1.1rem;
	}

	li + li {
		margin-top: 0.4rem;
	}

	li,
	.note,
	.more {
		font-size: 0.95rem;
		line-height: 1.65;
	}

	.note,
	.more {
		margin: 0.8rem 0 0;
	}

	.help-box {
		margin-top: 0.95rem;
		padding: 0.8rem 0.9rem;
		border-radius: 0.8rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: rgba(0, 0, 0, 0.02);
	}

	.help-title {
		margin: 0;
		font-size: 0.86rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		color: rgba(0, 0, 0, 0.72);
	}

	a {
		color: inherit;
		text-decoration: underline;
		text-decoration-thickness: from-font;
		text-underline-offset: 0.14em;
	}

	.emergency {
		color: rgba(0, 0, 0, 0.74);
	}

	:global(.dark) .trust-block {
		border-top-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .meta {
		color: rgba(255, 255, 255, 0.56);
	}

	:global(.dark) .emergency {
		color: rgba(255, 255, 255, 0.76);
	}

	:global(.dark) .help-box {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.03);
	}

	:global(.dark) .help-title {
		color: rgba(241, 245, 249, 0.88);
	}

	:global(.dark) h2 {
		color: rgba(241, 245, 249, 0.94);
	}

	:global(.dark) h3 {
		color: rgba(241, 245, 249, 0.94);
	}

	:global(.dark) .note,
	:global(.dark) .more,
	:global(.dark) li {
		color: rgba(241, 245, 249, 0.82);
	}

	:global(.dark) a {
		color: rgba(241, 245, 249, 0.82);
	}
</style>
