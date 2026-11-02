<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import WorldColoringExercise from '$lib/components/WorldColoringExercise.svelte';
	import { recordCreativeMoment } from '$lib/creative-moments';
	import {
		trackExerciseNextStepClicked,
		trackExerciseOpened,
		trackExerciseReachedEnd
	} from '$lib/analytics';
	import {
		buildExerciseEndParams,
		buildExerciseNextStepParams,
		buildExerciseOpenedParams,
		type ExerciseNextStepTarget,
		type ExerciseOpenedParams
	} from '$lib/exercise-analytics';
	import { ANALYTICS_CONSENT_EVENT, hasAnalyticsConsent } from '$lib/consent';
	import { formatToolMinutes } from '$lib/data/seo-architecture';
	import { supabase } from '$lib/supabase';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const guideHrefByPillar: Record<string, string | null> = {
		'existentiell-oro': null,
		relationsproblem: null,
		'social-angest': '/guider/angest/social-angest'
	};

	const guideHref = $derived(
		data.pillar.slug in guideHrefByPillar
			? guideHrefByPillar[data.pillar.slug]
			: `/guider/${data.pillar.slug}`
	);

	// Avslutningen leder till Dagboken utan förifylld text. Inloggade skickas
	// direkt till skrivfältet i incheckningen, eftersom /dagbok annars
	// omdirigerar dit ändå. Kvällstugan finns bara för inloggade.
	const isSignedIn = $derived(Boolean($page.data.authenticatedUser));
	const diaryHref = $derived(isSignedIn ? '/dagbok/checkin#skriv-sjalv' : '/dagbok?action=new');

	let creativeMomentSessionId: string | null = null;

	// Mätning: bara övningens slug och fasta källor/mål skickas (exercise-analytics.ts).
	// afterNavigate körs även när man går från en övning till en annan, där
	// komponenten återanvänds och onMount inte körs igen.
	//
	// Har besökaren inte samtyckt ännu sparas händelsen i minnet och skickas om
	// samtycket ges medan besökaren är kvar på samma övning. Annars skulle
	// den första övningen i ett besök aldrig räknas, eftersom cookiebannern
	// besvaras efter att sidan öppnats. Inget sparas i webbläsarens lagring.
	type PendingExerciseEvents = {
		slug: string;
		opened: ExerciseOpenedParams | null;
		reachedEnd: boolean;
	};
	let pending: PendingExerciseEvents | null = null;

	afterNavigate(({ from, to }) => {
		if (from?.url && to?.url && from.url.pathname === to.url.pathname) return;
		const params = buildExerciseOpenedParams(data.tool.slug, from?.url?.pathname);
		pending = null;
		if (!params) return;
		if (hasAnalyticsConsent()) {
			trackExerciseOpened(params);
		} else {
			pending = { slug: data.tool.slug, opened: params, reachedEnd: false };
		}
	});

	function sendReachedEnd(slug: string) {
		const params = buildExerciseEndParams(slug);
		if (!params) return;
		if (hasAnalyticsConsent()) {
			trackExerciseReachedEnd(params);
		} else if (pending?.slug === slug) {
			pending.reachedEnd = true;
		}
	}

	$effect(() => {
		function handleConsentChange() {
			if (!pending || !hasAnalyticsConsent()) return;
			const { slug, opened, reachedEnd } = pending;
			pending = null;
			// Vänta ett varv så att layoutens sidvisning, som skickas på samma
			// samtyckeshändelse, hamnar före övningens händelser.
			setTimeout(() => {
				if (slug !== data.tool.slug) return;
				if (opened) trackExerciseOpened(opened);
				if (reachedEnd) sendReachedEnd(slug);
			}, 0);
		}
		window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);
		return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);
	});

	let stepsList = $state<HTMLElement | null>(null);
	let reflectionsList = $state<HTMLElement | null>(null);

	// Slutet räknas som nått när den sista reflektionsfrågan (eller det sista
	// steget, om frågor saknas) syns i vyn, inte redan när rubriken gör det.
	// En gång per övning och sidvisning.
	$effect(() => {
		const slug = data.tool.slug;
		const list = reflectionsList ?? stepsList;
		const endItem = list?.lastElementChild ?? list;
		if (!endItem || typeof IntersectionObserver === 'undefined') return;

		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			observer.disconnect();
			sendReachedEnd(slug);
		});
		observer.observe(endItem);
		return () => observer.disconnect();
	});

	function trackNextStep(target: ExerciseNextStepTarget) {
		const params = buildExerciseNextStepParams(data.tool.slug, target);
		if (params) trackExerciseNextStepClicked(params);
	}

	async function registerWorldColoringMoment() {
		creativeMomentSessionId ??= crypto.randomUUID();
		const result = await recordCreativeMoment(supabase, creativeMomentSessionId);
		if (!result.ok && result.reason === 'save_failed') {
			console.error('[creative-moments] kunde inte spara stund', result.error?.message);
		}
	}
</script>

<SEO canonical={`https://mittpsyke.se${$page.url.pathname}`} />

<SeoHead
	title={`${data.tool.title} | Övningar | MittPsyke`}
	description={data.tool.description}
	canonical={`https://mittpsyke.se${$page.url.pathname}`}
/>
<div class="container tool-page">
	<Breadcrumbs items={[{ label: 'Övningar', href: '/ovningar' }, { label: data.tool.title }]} />

	<header class="intro">
		<h1>{data.tool.title}</h1>
		<p class="meta">
			{formatToolMinutes(data.tool)}{#if data.tool.involvesWriting}&nbsp;·&nbsp;<span class="sr-only">, </span>Med skrivande{/if}
		</p>
		<p>{data.tool.description}</p>
		<p class="note">
			Ett stöd för lugn och reflektion, inte vård eller behandling. Känns något för starkt kan du
			pausa när du vill.
		</p>
	</header>

	{#if data.tool.purpose}
		<section class="block">
			<h2>Syfte</h2>
			<p>{data.tool.purpose}</p>
		</section>
	{/if}

	{#if data.tool.steps && data.tool.steps.length > 0}
		<section class="block">
			<h2>Gör så här</h2>
			<ol class="step-list" bind:this={stepsList}>
				{#each data.tool.steps as step}
					<li>{step}</li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if data.tool.slug === 'mala-i-varlden'}
		<section class="block interactive-block">
			<WorldColoringExercise onCreativeMoment={registerWorldColoringMoment} />
		</section>
	{/if}

	{#if data.tool.reflections && data.tool.reflections.length > 0}
		<section class="block">
			<h2>Reflektera efteråt</h2>
			<ul class="reflect-list" bind:this={reflectionsList}>
				{#each data.tool.reflections as question}
					<li>{question}</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="block closing" aria-labelledby="closing-heading">
		<h2 id="closing-heading">När du är klar</h2>
		<p>
			Det räcker så här. Du behöver inte göra något mer. Vill du minnas något från övningen kan du
			skriva några rader, men det är helt frivilligt.
		</p>
		<ul class="next-links">
			<li>
				<a href={diaryHref} onclick={() => trackNextStep('diary')}>Skriv en rad i Dagboken</a>
			</li>
			{#if isSignedIn}
				<li>
					<a href="/dashboard/kvallsstugan" onclick={() => trackNextStep('evening')}
						>Gå till Kvällstugan</a
					>
				</li>
			{/if}
			<li>
				<a href="/ovningar" onclick={() => trackNextStep('overview')}>Tillbaka till övningarna</a>
			</li>
		</ul>
	</section>

	{#if data.relatedTools.length > 0}
		<section class="block">
			<h2>Fler övningar i samma område</h2>
			<ul class="link-list">
				{#each data.relatedTools as relatedTool}
					<li>
						<a
							href={`/ovningar/${relatedTool.slug}`}
							onclick={() => trackNextStep('related_exercise')}>{relatedTool.title}</a
						>
						<span class="link-meta">{formatToolMinutes(relatedTool)}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if guideHref}
		<section class="block">
			<h2>Guide i samma område</h2>
			<p>
				Vill du ha mer bakgrund finns guiden
				<a href={guideHref} onclick={() => trackNextStep('guide')}>{data.pillar.title}</a>.
			</p>
		</section>
	{/if}
</div>

<style>
	.tool-page {
		padding: 1.25rem 1.25rem 3.5rem;
	}

	.intro {
		margin-top: 0;
	}

	.intro h1 {
		margin: 0;
		font-size: clamp(1.8rem, 3.7vw, 2.45rem);
	}

	.intro p {
		margin: 0.75rem 0 0;
		max-width: 66ch;
		line-height: 1.65;
		opacity: 0.84;
	}

	.block {
		margin-top: 1.4rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(37, 99, 235, 0.14);
		background: #fbfcfd;
	}

	.intro .meta {
		margin-top: 0.4rem;
		font-size: 0.92rem;
		font-weight: 600;
		opacity: 0.78;
	}

	.intro .note {
		font-size: 0.9rem;
		opacity: 0.72;
	}

	.next-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
	}

	.next-links a {
		display: inline-block;
		padding: 0.35rem 0;
	}

	.link-meta {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.85rem;
		opacity: 0.72;
	}

	.block h2 {
		margin: 0;
		font-size: 1.16rem;
		line-height: 1.35;
	}

	.block p {
		margin: 0.65rem 0 0;
		line-height: 1.65;
	}

	.interactive-block {
		padding: 0;
		overflow: hidden;
	}

	.block a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.step-list {
		display: grid;
		gap: 0.65rem;
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.step-list li {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem;
		align-items: start;
		padding: 0.85rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(37, 99, 235, 0.12);
		background: #ffffff;
		line-height: 1.6;
	}

	.step-list li::before {
		counter-increment: step;
		content: counter(step);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 999px;
		background: #dbeafe;
		color: #1d4ed8;
		font-size: 0.88rem;
		font-weight: 700;
	}

	.link-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.65rem;
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
	}

	.link-list li {
		padding: 0.8rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(37, 99, 235, 0.12);
		background: #ffffff;
		line-height: 1.55;
	}

	.reflect-list {
		display: grid;
		gap: 0.65rem;
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
	}

	.reflect-list li {
		padding: 0.8rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(37, 99, 235, 0.12);
		background: #ffffff;
		line-height: 1.55;
	}

	:global(.dark) .block {
		background: #111827;
		border-color: rgba(96, 165, 250, 0.18);
	}

	:global(.dark) .step-list li,
	:global(.dark) .link-list li,
	:global(.dark) .reflect-list li {
		background: #172033;
		border-color: rgba(147, 197, 253, 0.18);
	}

	:global(.dark) .step-list li::before {
		background: rgba(37, 99, 235, 0.22);
		color: #bfdbfe;
	}

	@media (max-width: 640px) {
		.tool-page {
			padding: 1.1rem 1rem 3rem;
		}

		.block {
			padding: 0.95rem 0.9rem;
		}

		.step-list,
		.link-list,
		.reflect-list {
			gap: 0.55rem;
		}

		.link-list {
			grid-template-columns: 1fr;
		}

		.step-list li,
		.link-list li,
		.reflect-list li {
			padding: 0.8rem 0.85rem;
		}
	}
</style>
