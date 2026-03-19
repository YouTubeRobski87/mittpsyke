<script lang="ts">
	type BlogArticleProps = {
		children?: () => unknown;
		title: string;
		lead: string;
		publishedLabel: string;
		readTime?: string;
		ctaHref?: string;
		ctaLabel?: string;
		ctaBody?: string;
		ctaSecondaryHref?: string;
		ctaSecondaryLabel?: string;
	};

	let {
		children,
		title,
		lead,
		publishedLabel,
		readTime = '8 min',
		ctaHref = '/register',
		ctaLabel = 'Prova MittPsyke gratis',
		ctaBody =
			'Vill du testa i praktiken? Börja skriva i lugn takt och se vad som hjälper dig att förstå ditt mående över tid.',
		ctaSecondaryHref = '/skriv',
		ctaSecondaryLabel = 'Börja anonymt'
	}: BlogArticleProps = $props();
</script>

<article class="blog-article">
	<header class="article-header">
		<p class="article-eyebrow">MittPsyke Blogg</p>
		<h1>{title}</h1>
		<p class="article-lead">{lead}</p>
		<p class="article-meta">Publicerad {publishedLabel} · Lästid {readTime}</p>
	</header>

	<div class="article-content">
		{@render children?.()}
	</div>

	<section class="article-cta" aria-label="Prova MittPsyke">
		<h2>Vill du prova själv i lugn takt?</h2>
		<p>{ctaBody}</p>
		<div class="article-cta-actions">
			<a class="article-cta-primary" href={ctaHref}>{ctaLabel}</a>
			<a class="article-cta-secondary" href={ctaSecondaryHref}>{ctaSecondaryLabel}</a>
		</div>
	</section>
</article>

<style>
	.blog-article {
		max-width: 820px;
		margin: 0 auto;
		padding: clamp(2.2rem, 6vw, 3rem) clamp(1.05rem, 4vw, 1.4rem) clamp(3.2rem, 8vw, 4rem);
		display: grid;
		gap: 1.5rem;
	}

	.article-header {
		max-width: 720px;
	}

	.article-eyebrow {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.72;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		margin-top: 0.6rem;
		font-size: clamp(1.95rem, 1.55rem + 2.2vw, 2.6rem);
		line-height: 1.08;
	}

	.article-lead {
		margin: 0.95rem 0 0;
		font-size: clamp(1.03rem, 0.99rem + 0.5vw, 1.16rem);
		line-height: 1.72;
		opacity: 0.88;
	}

	.article-meta {
		margin: 0.7rem 0 0;
		font-size: 0.9rem;
		opacity: 0.64;
	}

	.article-content {
		max-width: 720px;
		display: grid;
		gap: 1.2rem;
	}

	.article-content :global(section) {
		display: grid;
		gap: 0.85rem;
	}

	.article-content :global(h2) {
		font-size: clamp(1.38rem, 1.2rem + 0.7vw, 1.62rem);
		line-height: 1.2;
		color: #184f4a;
	}

	.article-content :global(p),
	.article-content :global(li) {
		margin: 0;
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.96rem + 0.35vw, 1.08rem);
		line-height: 1.75;
		letter-spacing: -0.003em;
	}

	.article-content :global(ul) {
		margin: 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.45rem;
	}

	.article-content :global(a) {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.article-cta {
		max-width: 720px;
		margin-top: 0.35rem;
		padding: 1.05rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: #ecf5f2;
	}

	.article-cta h2 {
		font-size: 1.25rem;
		line-height: 1.2;
	}

	.article-cta p {
		margin: 0.65rem 0 0;
		font-size: 0.98rem;
		line-height: 1.65;
	}

	.article-cta-actions {
		margin-top: 0.9rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.article-cta-primary,
	.article-cta-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.56rem 0.95rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-heading);
		font-weight: 600;
		text-decoration: none;
	}

	.article-cta-primary {
		background: var(--primary);
		border: 1px solid var(--primary);
		color: #ffffff;
	}

	.article-cta-secondary {
		background: transparent;
		border: 1px solid rgba(15, 23, 42, 0.18);
	}

	@media (max-width: 640px) {
		.article-cta-primary,
		.article-cta-secondary {
			width: 100%;
		}
	}

	:global(.dark) .article-content :global(h2) {
		color: #9ad7ce;
	}

	:global(.dark) .article-cta {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .article-cta-secondary {
		border-color: rgba(255, 255, 255, 0.2);
	}
</style>
