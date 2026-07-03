<script lang="ts">
	export let variant: 'dashboard' | 'progress' = 'dashboard';

	const titleId = `account-teaser-title-${variant}`;
	const openLinks = [
		{
			href: '/chat',
			label: 'Chatta anonymt',
			description: 'Skriv några ord i lugn takt.'
		},
		{
			href: '/guider',
			label: 'Guider',
			description: 'Läs när du vill förstå mer.'
		},
		{
			href: '/ovningar',
			label: 'Verktyg',
			description: 'Hitta en enkel övning för stunden.'
		},
		{
			href: '/dagbok?action=new',
			label: 'Anonym dagbok',
			description: 'Skriv fritt utan konto här och nu.'
		}
	];
</script>

<section class="account-teaser" aria-labelledby={titleId}>
	<div class="teaser-copy">
		<p class="eyebrow">När du vill spara platsen</p>
		<h2 id={titleId}>Skapa ett konto för att ge din följeslagare ett hem.</h2>
		<p>Din dagbok, din Growth Garden och din plats väntar på dig nästa gång.</p>
	</div>

	<div class="account-actions" aria-label="Kontolänkar">
		<a class="primary-action" href="/register">Skapa konto</a>
		<a class="secondary-action" href="/login">Jag har redan konto</a>
	</div>

	<nav class="open-links" aria-label="Öppna delar utan konto">
		{#each openLinks as link}
			<a href={link.href}>
				<strong>{link.label}</strong>
				<span>{link.description}</span>
			</a>
		{/each}
	</nav>
</section>

<style>
	.account-teaser {
		display: grid;
		gap: 1.1rem;
		padding: clamp(1.1rem, 2vw, 1.45rem);
		border-radius: 8px;
		border: 1px solid rgba(81, 105, 80, 0.16);
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(248, 244, 232, 0.68)),
			rgba(255, 255, 255, 0.72);
		box-shadow: 0 16px 38px rgba(69, 83, 61, 0.08);
		backdrop-filter: blur(18px);
		color: hsl(var(--foreground));
	}

	.teaser-copy {
		display: grid;
		gap: 0.45rem;
		max-width: 46rem;
	}

	.eyebrow {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-size: clamp(1.18rem, 2vw, 1.55rem);
		line-height: 1.25;
		letter-spacing: 0;
	}

	p {
		margin: 0;
		color: hsl(var(--muted-foreground));
		line-height: 1.65;
	}

	.account-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}

	.primary-action,
	.secondary-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.55rem;
		padding: 0.65rem 1rem;
		border-radius: 8px;
		font-weight: 700;
		text-decoration: none;
	}

	.primary-action {
		background: #557c68;
		color: #fff;
		box-shadow: 0 10px 24px rgba(85, 124, 104, 0.16);
	}

	.secondary-action {
		border: 1px solid rgba(85, 124, 104, 0.2);
		background: rgba(255, 255, 255, 0.52);
		color: #405b4e;
	}

	.open-links {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.open-links a {
		display: grid;
		gap: 0.25rem;
		min-height: 4.9rem;
		padding: 0.8rem;
		border-radius: 8px;
		border: 1px solid rgba(85, 124, 104, 0.13);
		background: rgba(255, 255, 255, 0.48);
		color: inherit;
		text-decoration: none;
	}

	.open-links strong {
		font-size: 0.92rem;
	}

	.open-links span {
		color: hsl(var(--muted-foreground));
		font-size: 0.82rem;
		line-height: 1.45;
	}

	@media (max-width: 760px) {
		.open-links {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 460px) {
		.account-actions,
		.open-links {
			grid-template-columns: 1fr;
		}

		.primary-action,
		.secondary-action {
			width: 100%;
		}
	}
</style>
