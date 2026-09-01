<script lang="ts">
	import {
		ArrowRight,
		BookOpen,
		House,
		MessageCircle,
		MoonStar,
		Newspaper,
		PenLine,
		Sparkles,
		TrendingUp
	} from 'lucide-svelte';
	import CompanionAvatar from '$lib/components/CompanionAvatar.svelte';
	import type { ProgressCompanionSelection } from '$lib/progressCompanion';

	let {
		overview
	}: {
		overview: {
			displayName: string | null;
			entryCount: number;
			progressCompanion: ProgressCompanionSelection | string | null;
		};
	} = $props();

	const hasEntries = $derived(overview.entryCount > 0);
	const greeting = $derived(
		overview.displayName ? `Välkommen tillbaka, ${overview.displayName}` : 'Välkommen tillbaka'
	);
	const primaryLabel = $derived(hasEntries ? 'Skriv en stund' : 'Skriv din första rad');
	const signal = $derived(
		overview.entryCount === 1
			? 'En sparad text finns kvar när du vill återvända till den.'
			: `${overview.entryCount} sparade texter finns kvar när du vill återvända till dem.`
	);
</script>

<main class="signed-home" aria-labelledby="signed-home-title">
	<div class="signed-home-inner">
		<section class="returning" aria-labelledby="signed-home-title">
			<div class="returning-copy">
				<p class="eyebrow">Din översikt</p>
				<h1 id="signed-home-title">{greeting}</h1>
				<p class="returning-lead">
					Allt behöver inte få plats på en gång. Välj det som passar just nu.
				</p>
				<a class="primary-action" href="/dagbok?action=new">
					<PenLine size={18} aria-hidden="true" />
					{primaryLabel}
					<ArrowRight size={18} aria-hidden="true" />
				</a>
			</div>

			<aside class="companion-note" aria-label="Din plats">
				<CompanionAvatar selection={overview.progressCompanion} size="xl" decorative />
				<div>
					<p>Din plats finns kvar.</p>
					<span>Du kan gå vidare i din takt.</span>
				</div>
			</aside>
		</section>

		{#if hasEntries}
			<p class="personal-signal">
				<Sparkles size={16} aria-hidden="true" />
				{signal}
			</p>
		{/if}

		<section class="places" aria-labelledby="places-title">
			<div class="section-heading">
				<p class="eyebrow">Hitta vidare</p>
				<h2 id="places-title">Ditt MittPsyke</h2>
			</div>

			<div class="places-layout">
				<a class="home-place" href="/dashboard">
					<img
						src="/images/scenes/dashboard-cabin-close-800.webp"
						alt=""
						width="800"
						height="450"
						loading="lazy"
						decoding="async"
					/>
					<span class="home-place-shade" aria-hidden="true"></span>
					<span class="place-copy">
						<span class="place-icon"><House size={20} aria-hidden="true" /></span>
						<span>
							<strong>Mitt Hem</strong>
							<small>Din levande plats och följeslagaren.</small>
						</span>
						<ArrowRight size={20} aria-hidden="true" />
					</span>
				</a>

				<div class="other-places">
					<a class="chat-place" href="/chat">
						<span class="place-icon"><MessageCircle size={21} aria-hidden="true" /></span>
						<span>
							<strong>Chatten</strong>
							<small>Prata en stund när det hjälper att sortera.</small>
						</span>
						<ArrowRight size={19} aria-hidden="true" />
					</a>

					<div class="route-grid" aria-label="Fler platser i MittPsyke">
						<a href="/framsteg">
							<TrendingUp size={19} aria-hidden="true" />
							<span><strong>Framsteg</strong><small>Se vad som tar form över tid.</small></span>
						</a>
						<a href="/dagbok">
							<BookOpen size={19} aria-hidden="true" />
							<span><strong>Dagbok</strong><small>Skriv, reflektera och återvänd.</small></span>
						</a>
						<a href="/dashboard/kvallsstugan">
							<MoonStar size={19} aria-hidden="true" />
							<span><strong>Kvällslugn</strong><small>En stilla incheckning när dagen landar.</small></span>
						</a>
						<a href="/blogg">
							<Newspaper size={19} aria-hidden="true" />
							<span><strong>Artiklar</strong><small>Ord och perspektiv när du hellre vill läsa.</small></span>
						</a>
					</div>
				</div>
			</div>
		</section>
	</div>
</main>

<style>
	.signed-home {
		min-height: calc(100vh - 8rem);
		padding: clamp(1.1rem, 3vw, 2.5rem) 1rem clamp(2.5rem, 6vw, 5rem);
		background:
			radial-gradient(circle at 85% 0%, var(--dashboard-bg-accent), transparent 31rem),
			linear-gradient(180deg, var(--dashboard-bg-start), var(--dashboard-bg-end));
		color: var(--color-dashboard-text);
	}

	.signed-home-inner {
		width: min(var(--portal-max), 100%);
		margin: 0 auto;
	}

	.returning {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: clamp(1.5rem, 5vw, 4rem);
		align-items: center;
		padding: clamp(1.5rem, 4vw, 3rem);
		border: 1px solid var(--color-dashboard-border);
		border-radius: clamp(1.4rem, 3vw, 2rem);
		background: var(--color-dashboard-surface);
		box-shadow: 0 16px 40px var(--shadow-color);
	}

	.eyebrow {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-dashboard-text-muted);
	}

	h1,
	h2,
	p {
		margin-top: 0;
	}

	h1 {
		max-width: 16ch;
		margin-bottom: 0;
		font-size: clamp(2rem, 5vw, 3.45rem);
		color: var(--color-dashboard-text);
	}

	.returning-lead {
		max-width: 43ch;
		margin: 0.8rem 0 0;
		color: var(--color-dashboard-text-muted);
	}

	.primary-action {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 46px;
		margin-top: 1.35rem;
		padding: 0.72rem 1rem;
		border-radius: var(--radius-pill);
		background: var(--color-primary);
		color: white;
		font-family: var(--font-heading);
		font-weight: 700;
		box-shadow: 0 8px 18px rgba(var(--primary-rgb), 0.18);
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.primary-action :global(svg:last-child) {
		margin-left: 0.1rem;
	}

	.primary-action:hover,
	.primary-action:focus-visible {
		transform: translateY(-1px);
		box-shadow: 0 10px 22px rgba(var(--primary-rgb), 0.26);
	}

	.companion-note {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		max-width: 17rem;
		padding: 0.85rem 1rem;
		border-radius: 1.25rem;
		background: color-mix(in srgb, var(--color-dashboard-surface-strong) 82%, transparent);
		color: var(--color-dashboard-text);
	}

	.companion-note :global(.companion-avatar) {
		flex: 0 0 auto;
	}

	.companion-note p {
		margin-bottom: 0.1rem;
		font-family: var(--font-heading);
		font-weight: 650;
	}

	.companion-note span {
		font-size: 0.84rem;
		line-height: 1.45;
		color: var(--color-dashboard-text-muted);
	}

	.personal-signal {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 1.1rem 0 0;
		padding-left: 0.2rem;
		font-size: 0.92rem;
		color: var(--color-dashboard-text-muted);
	}

	.personal-signal :global(svg) {
		color: var(--color-primary);
	}

	.places {
		margin-top: clamp(2.2rem, 6vw, 4.5rem);
	}

	.section-heading h2 {
		margin-bottom: 0;
		font-size: clamp(1.55rem, 3vw, 2.25rem);
		color: var(--color-dashboard-text);
	}

	.places-layout {
		display: grid;
		grid-template-columns: minmax(16rem, 0.86fr) minmax(0, 1.14fr);
		gap: 1rem;
		margin-top: 1.15rem;
	}

	.home-place,
	.chat-place,
	.route-grid a {
		position: relative;
		min-width: 0;
		overflow: hidden;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 1.25rem;
		background: var(--color-dashboard-surface);
		transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
	}

	.home-place {
		display: grid;
		min-height: 23rem;
		isolation: isolate;
		color: white;
	}

	.home-place img {
		position: absolute;
		inset: 0;
		z-index: -2;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 35% center;
	}

	.home-place-shade {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: linear-gradient(180deg, transparent 25%, rgb(10 20 33 / 0.88) 100%);
	}

	.place-copy {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 0.75rem;
		align-items: end;
		align-self: end;
		padding: 1.2rem;
	}

	.place-copy strong,
	.chat-place strong,
	.route-grid strong {
		display: block;
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 700;
	}

	.place-copy small,
	.chat-place small,
	.route-grid small {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.84rem;
		line-height: 1.45;
		color: inherit;
		opacity: 0.82;
	}

	.place-icon {
		display: grid;
		width: 2.35rem;
		height: 2.35rem;
		place-items: center;
		border: 1px solid rgb(255 255 255 / 0.2);
		border-radius: 0.8rem;
		background: rgb(255 255 255 / 0.12);
	}

	.other-places {
		display: grid;
		gap: 1rem;
	}

	.chat-place {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 0.8rem;
		align-items: center;
		padding: 1.1rem 1.2rem;
		background: color-mix(in srgb, var(--color-dashboard-surface-strong) 87%, var(--color-primary) 13%);
		color: var(--color-dashboard-text);
	}

	.chat-place .place-icon {
		border-color: var(--primary-border-soft);
		background: var(--primary-soft);
		color: var(--color-primary);
	}

	.route-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.route-grid a {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		min-height: 8.45rem;
		padding: 1rem;
		color: var(--color-dashboard-text);
	}

	.route-grid :global(svg) {
		flex: 0 0 auto;
		margin-top: 0.15rem;
		color: var(--color-primary);
	}

	.home-place:hover,
	.home-place:focus-visible,
	.chat-place:hover,
	.chat-place:focus-visible,
	.route-grid a:hover,
	.route-grid a:focus-visible {
		border-color: var(--primary-border-soft);
		background-color: color-mix(in srgb, var(--color-dashboard-surface-strong) 88%, var(--primary) 12%);
		transform: translateY(-2px);
	}

	.home-place:hover,
	.home-place:focus-visible {
		background-color: transparent;
	}

	@media (max-width: 760px) {
		.returning,
		.places-layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.returning {
			gap: 1.25rem;
		}

		.companion-note {
			max-width: none;
		}

		.home-place {
			min-height: 17rem;
		}
	}

	@media (max-width: 430px) {
		.signed-home {
			padding-inline: 0.75rem;
		}

		.returning {
			padding: 1.2rem;
		}

		.route-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.route-grid a {
			min-height: auto;
		}
	}

	@media (max-width: 320px) {
		.primary-action {
			width: 100%;
			justify-content: center;
		}

		.companion-note {
			align-items: flex-start;
			padding: 0.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.primary-action,
		.home-place,
		.chat-place,
		.route-grid a {
			transition: none;
			transform: none !important;
		}
	}
</style>
