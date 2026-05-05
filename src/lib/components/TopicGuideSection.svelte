<script lang="ts">
	type TopicGuideLink = {
		title: string;
		href: string;
	};

	type TopicGuideSectionProps = {
		topicTitle: string;
		guideHref: string;
		guideTitle?: string;
		intro?: string;
		articleLinks?: TopicGuideLink[];
	};

	let {
		topicTitle,
		guideHref,
		guideTitle,
		intro,
		articleLinks = []
	}: TopicGuideSectionProps = $props();

	const displayedGuideTitle = $derived(guideTitle ?? topicTitle.toLowerCase());
	const displayedIntro = $derived(
		intro ??
			`Det här är startsidan för ${topicTitle.toLowerCase()}. När du vill läsa vidare hittar du fördjupning, artiklar och vanliga frågor i guiden.`
	);
</script>

<section class="topic-guide" aria-label={`Fördjupning om ${topicTitle.toLowerCase()}`}>
	<p class="eyebrow">Fördjupning</p>
	<h2>Läs vidare i guiden om {displayedGuideTitle}</h2>
	<p class="intro">{displayedIntro}</p>
	<a class="guide-entry" href={guideHref}>Öppna guiden om {displayedGuideTitle}</a>

	{#if articleLinks.length}
		<ul class="article-list">
			{#each articleLinks as article}
				<li><a href={article.href}>{article.title}</a></li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.topic-guide {
		max-width: 720px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: var(--radius-card);
		padding: 1.05rem;
		background: rgba(226, 240, 236, 0.6);
	}

	.eyebrow {
		margin: 0 0 0.45rem;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: var(--primary);
	}

	h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.intro {
		margin: 0.6rem 0 0;
		font-family: var(--font-body);
		font-size: clamp(0.98rem, 0.95rem + 0.25vw, 1.05rem);
		line-height: 1.65;
	}

	.guide-entry {
		display: inline-flex;
		margin-top: 0.8rem;
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.article-list {
		list-style: none;
		padding: 0;
		margin: 0.9rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.article-list a {
		font-family: var(--font-body);
		font-size: clamp(0.95rem, 0.92rem + 0.25vw, 1.05rem);
		color: var(--primary);
		text-decoration: underline;
		text-decoration-color: rgba(15, 118, 110, 0.35);
		text-underline-offset: 3px;
	}

	.article-list a:hover,
	.guide-entry:hover {
		opacity: 0.82;
	}

	:global(.dark) .topic-guide {
		background: #1a1a1a;
		color: #f5f5f5;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .eyebrow,
	:global(.dark) .guide-entry,
	:global(.dark) .article-list a {
		color: #86dfd6;
	}

	:global(.dark) .intro {
		color: rgba(255, 255, 255, 0.85);
	}
</style>
