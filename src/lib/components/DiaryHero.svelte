<script lang="ts">
	import { trackDiaryCtaClick } from '$lib/analytics';

	type Variant = 'diary-main' | 'diary-landing';

	interface Props {
		variant: Variant;
		title?: string;
		subtitle?: string;
		lead?: string;
		ctaHref?: string;
		ctaLabel?: string;
		secondaryHref?: string;
		secondaryLabel?: string;
	}

	let {
		variant,
		title = 'Skriv anonymt och följ ditt mående',
		subtitle,
		lead = 'Skriv några rader direkt och välj senare om du vill spara.',
		ctaHref = '/dagbok?action=new',
		ctaLabel = 'Börja skriva anonymt nu',
		secondaryHref,
		secondaryLabel
	}: Props = $props();

	const heroBenefits = [
		'Skriv av dig när tankarna snurrar',
		'Följ mående och små skiften',
		'Se mönster över tid'
	];

	// Standard-subtitle beror på variant
	const resolvedSubtitle = $derived(
		subtitle ??
			(variant === 'diary-landing'
				? 'Din text sparas lokalt. Inget konto krävs.'
				: 'Inget konto krävs för att börja. Skapa konto senare om du vill spara och följa över tid.')
	);

	function handleCtaClick() {
		trackDiaryCtaClick(variant);
	}
</script>

<section
	class="diary-hero"
	class:landing={variant === 'diary-landing'}
	class:main={variant === 'diary-main'}
	aria-label="Dagbokens hero"
>
	<div class="diary-hero-inner">
		<div class="diary-hero-copy">
			<p class="eyebrow">Anonym dagbok</p>
			<h1>{title}</h1>
			<p class="lead">{lead}</p>
			<div class="cta-row">
				<a class="primary-cta" href={ctaHref} onclick={handleCtaClick}>{ctaLabel}</a>
				{#if secondaryHref && secondaryLabel}
					<a class="secondary-cta" href={secondaryHref}>{secondaryLabel}</a>
				{/if}
			</div>
			<p class="subtext">{resolvedSubtitle}</p>
		</div>

		{#if variant === 'diary-main'}
			<div class="hero-benefits" aria-label="Vad dagboken hjälper med">
				<p class="hero-benefits-title">En lugn plats för reflektion</p>
				<ul>
					{#each heroBenefits as benefit}
						<li>{benefit}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</section>

<style>
	.diary-hero {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 1.25rem;
	}

	.diary-hero-inner {
		border-radius: 24px;
		border: 1px solid hsl(var(--border));
		background:
			radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 42%),
			radial-gradient(circle at bottom right, rgba(67, 110, 143, 0.12), transparent 45%),
			linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--surface-soft)) 100%);
		padding: clamp(1.4rem, 3vw, 2.4rem);
		display: grid;
		gap: 0.85rem;
		box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
	}

	.diary-hero.main .diary-hero-inner {
		align-items: center;
		gap: clamp(1.2rem, 4vw, 3rem);
		min-height: 22rem;
	}

	.diary-hero.landing .diary-hero-inner {
		padding: clamp(1.8rem, 4vw, 3rem);
		background:
			radial-gradient(circle at top left, rgba(20, 184, 166, 0.22), transparent 48%),
			radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.14), transparent 50%),
			linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--surface-soft)) 100%);
		box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
	}

	.diary-hero-copy {
		display: grid;
		gap: 0.85rem;
		max-width: 42rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(2rem, 1.5rem + 2vw, 3rem);
		line-height: 1.05;
		letter-spacing: -0.04em;
		color: hsl(var(--foreground));
	}

	.diary-hero.landing h1 {
		font-size: clamp(2.2rem, 1.6rem + 2.6vw, 3.6rem);
	}

	.lead {
		margin: 0;
		max-width: 38rem;
		font-size: 1.05rem;
		line-height: 1.6;
		color: hsl(var(--foreground) / 0.84);
	}

	.cta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding-top: 0.4rem;
	}

	.primary-cta,
	.secondary-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.95rem;
		padding: 0.78rem 1.35rem;
		border-radius: var(--radius-pill);
		text-decoration: none;
		font-family: var(--font-heading);
		font-weight: 600;
		transition:
			transform 150ms ease,
			opacity 150ms ease,
			box-shadow 150ms ease;
	}

	.primary-cta {
		background: var(--theme-accent, var(--primary));
		color: #fff;
		box-shadow: 0 12px 24px rgba(15, 118, 110, 0.18);
	}

	.diary-hero.landing .primary-cta {
		min-height: 3.2rem;
		padding: 0.9rem 1.6rem;
		font-size: 1.05rem;
	}

	.secondary-cta {
		border: 1px solid hsl(var(--border));
		color: hsl(var(--foreground));
		background: hsl(var(--surface-soft));
	}

	.primary-cta:hover,
	.secondary-cta:hover {
		transform: translateY(-1px);
	}

	.subtext {
		margin: 0;
		font-size: 0.9rem;
		color: hsl(var(--muted-foreground));
	}

	.hero-benefits {
		display: grid;
		gap: 0.8rem;
		padding: 1rem 0 0;
		border-top: 1px solid hsl(var(--border));
	}

	.hero-benefits-title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 650;
		color: hsl(var(--foreground));
	}

	.hero-benefits ul {
		display: grid;
		gap: 0.55rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.hero-benefits li {
		position: relative;
		padding-left: 1.15rem;
		color: hsl(var(--foreground) / 0.82);
		line-height: 1.45;
	}

	.hero-benefits li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.62em;
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 999px;
		background: var(--theme-accent, var(--primary));
	}

	@media (max-width: 640px) {
		.diary-hero {
			padding: 0 0.75rem;
		}

		.diary-hero-inner {
			padding: 1.1rem;
			gap: 0.65rem;
			min-height: auto;
		}

		h1 {
			font-size: 1.85rem;
			line-height: 1.08;
		}

		.diary-hero.landing h1 {
			font-size: 2rem;
		}

		.lead {
			font-size: 0.97rem;
		}

		.cta-row {
			display: grid;
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.primary-cta,
		.secondary-cta {
			width: 100%;
			min-height: 2.8rem;
		}
	}

	@media (min-width: 840px) {
		.diary-hero.main .diary-hero-inner {
			grid-template-columns: minmax(0, 1.3fr) minmax(15rem, 0.7fr);
		}

		.hero-benefits {
			padding: 1.1rem 0 1.1rem 1.25rem;
			border-top: 0;
			border-left: 1px solid hsl(var(--border));
		}
	}
</style>
