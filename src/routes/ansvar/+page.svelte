<svelte:head>
	<title>Ansvarsinfo | MittPsyke</title>
	<meta
		name="description"
		content="Tydlig information om MittPsyke som AI-baserat samtalsstöd, dess begränsningar och när du bör söka vård."
	/>
</svelte:head>

<main class="ansvar-content mx-auto w-full px-5 py-10">
	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Ansvarsinfo</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke är ett AI-baserat samtalsstöd. Tjänsten är till för reflektion och stöd i vardagen, men ersätter inte
		vård av läkare, psykolog eller annan legitimerad vårdpersonal.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Viktiga begränsningar</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Innehållet i tjänsten kan vara ofullständigt eller bli fel. MittPsyke ställer inte diagnos, erbjuder inte
		individanpassad behandling och ska inte användas som enda underlag för medicinska beslut.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">När du bör söka vård</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Om du mår dåligt under längre tid, får ökade symtom eller behöver professionell bedömning bör du kontakta vården.
		För vårdråd i Sverige kan du kontakta 1177.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Akut situation</h2>
	<p class="opacity-80 leading-relaxed">
		Vid akut fara, ring 112. Du kan också använda
		<a
			href="https://stodlinjer.se"
			target="_blank"
			rel="noopener noreferrer"
			class="underline hover:no-underline"
		>
			Akut hjälp
		</a>
		för att hitta stödlinjer.
	</p>
</main>

<style>
	.ansvar-content {
		max-width: 720px;
	}

	.ansvar-content p {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
		margin-bottom: 1rem;
	}

	.ansvar-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.ansvar-content h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}
</style>
