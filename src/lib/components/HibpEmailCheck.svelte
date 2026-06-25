<script lang="ts">
	type Breach = {
		name: string;
		title: string;
		domain: string;
		breachDate: string;
		dataClasses: string[];
		isVerified: boolean;
		isSensitive: boolean;
	};

	let email = $state('');
	let breaches = $state<Breach[] | null>(null);
	let message = $state('');
	let error = $state('');
	let isLoading = $state(false);

	function isValidEmail(value: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
	}

	async function checkEmail() {
		const normalizedEmail = email.trim();
		error = '';
		message = '';
		breaches = null;

		if (!isValidEmail(normalizedEmail)) {
			error = 'Skriv en giltig e-postadress.';
			return;
		}

		isLoading = true;

		try {
			const response = await fetch('/api/hibp/breaches', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ email: normalizedEmail })
			});

			const data = await response.json();

			if (!response.ok) {
				error =
					typeof data?.message === 'string'
						? data.message
						: 'Det gick inte att kontrollera e-postadressen just nu.';
				return;
			}

			const result = Array.isArray(data?.breaches) ? data.breaches : [];
			breaches = result;
			message =
				result.length > 0
					? `Din e-post förekommer i ${result.length} dataintrång.`
					: 'Inga kända träffar hittades.';
		} catch {
			error = 'Det gick inte att kontrollera e-postadressen just nu.';
		} finally {
			isLoading = false;
		}
	}
</script>

<section class="hibp-check" aria-labelledby="hibp-heading">
	<div class="intro">
		<p class="eyebrow">E-post och dataintrång</p>
		<h2 id="hibp-heading">Kontrollera om din e-post förekommer i kända dataintrång</h2>
		<p>
			Skriv in din e-postadress så skickar vi den till Have I Been Pwned via vår server. Vi sparar
			inte adressen i databas och visar bara svaret här i webbläsaren.
		</p>
	</div>

	<form class="check-form" onsubmit={(event) => { event.preventDefault(); checkEmail(); }}>
		<label for="hibp-email">E-postadress</label>
		<div class="form-row">
			<input
				id="hibp-email"
				name="email"
				type="email"
				autocomplete="email"
				bind:value={email}
				placeholder="namn@example.com"
				required
			/>
			<button type="submit" disabled={isLoading}>
				{isLoading ? 'Kontrollerar…' : 'Kontrollera'}
			</button>
		</div>
	</form>

	{#if error}
		<p class="status error" role="alert">{error}</p>
	{:else if message}
		<p class="status" role="status">{message}</p>
	{/if}

	{#if breaches && breaches.length > 0}
		<ul class="breach-list" aria-label="Dataintrång där e-postadressen förekommer">
			{#each breaches as breach}
				<li>
					<div>
						<h3>{breach.title}</h3>
						{#if breach.domain || breach.breachDate}
							<p class="meta">
								{#if breach.domain}{breach.domain}{/if}
								{#if breach.domain && breach.breachDate} · {/if}
								{#if breach.breachDate}{breach.breachDate}{/if}
							</p>
						{/if}
					</div>
					{#if breach.dataClasses.length > 0}
						<p class="data-classes">
							Exponerad data: {breach.dataClasses.slice(0, 6).join(', ')}
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<p class="attribution">
		Data hämtas från
		<a href="https://haveibeenpwned.com/" target="_blank" rel="noopener noreferrer">
			Have I Been Pwned
		</a>.
	</p>
</section>

<style>
	.hibp-check {
		display: grid;
		gap: 1.25rem;
		padding: 1.25rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--surface-soft));
	}

	.intro {
		display: grid;
		gap: 0.55rem;
	}

	.eyebrow {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.72;
	}

	h2,
	h3,
	p {
		margin: 0;
	}

	h2 {
		font-family: var(--font-heading);
		font-size: clamp(1.35rem, 4vw, 1.85rem);
		line-height: 1.15;
	}

	h3 {
		font-family: var(--font-heading);
		font-size: 1rem;
	}

	p,
	label,
	input,
	button {
		font-family: var(--font-body);
	}

	.intro p,
	.meta,
	.data-classes,
	.attribution {
		opacity: 0.78;
		line-height: 1.65;
	}

	.check-form {
		display: grid;
		gap: 0.5rem;
	}

	label {
		font-weight: 700;
	}

	.form-row {
		display: grid;
		gap: 0.75rem;
	}

	input {
		width: 100%;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--background));
		color: inherit;
		padding: 0.85rem 1rem;
	}

	button {
		border: 0;
		border-radius: var(--radius-pill);
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		cursor: pointer;
		font-weight: 800;
		padding: 0.85rem 1.2rem;
	}

	button:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.status {
		border-radius: var(--radius-card);
		background: rgba(34, 197, 94, 0.1);
		padding: 0.9rem 1rem;
		font-weight: 700;
	}

	.status.error {
		background: rgba(248, 113, 113, 0.12);
	}

	.breach-list {
		display: grid;
		gap: 0.85rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.breach-list li {
		display: grid;
		gap: 0.45rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--background));
		padding: 1rem;
	}

	.attribution a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	@media (min-width: 640px) {
		.hibp-check {
			padding: 1.5rem;
		}

		.form-row {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
		}
	}
</style>
