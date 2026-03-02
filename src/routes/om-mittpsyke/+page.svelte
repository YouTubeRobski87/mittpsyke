<svelte:head>
	<title>Om MittPsyke &ndash; Tryggt st&ouml;d f&ouml;r ditt psyke</title>
</svelte:head>

<main class="page">
	<div class="page-container">
		<article class="text-block">
			<section class="section intro">
				<h1>Om MittPsyke</h1>
				<p>
					MittPsyke &auml;r en svensk plattform f&ouml;r digitalt samtalsst&ouml;d, skapad f&ouml;r m&auml;nniskor som
					lever med psykisk belastning i olika former. Tanken &auml;r att erbjuda ett tryggt och tillg&auml;ngligt
					rum d&auml;r det g&aring;r att stanna upp, s&auml;tta ord p&aring; det som k&auml;nns sv&aring;rt och f&aring;
					st&ouml;d i stunden, utan att beh&ouml;va prestera eller f&ouml;rklara allt fr&aring;n b&ouml;rjan.
				</p>
			</section>

			<section class="section">
				<h2>Ett kompletterande st&ouml;d</h2>
				<p>
					Plattformen fungerar som ett kompletterande st&ouml;d mellan, f&ouml;re eller efter kontakt med
					v&aring;rden. I centrum finns ett AI-baserat samtalsst&ouml;d som &auml;r utformat f&ouml;r att svara med
					lugn, respekt och empati. M&aring;let &auml;r inte att ers&auml;tta professionell behandling, utan att
					g&ouml;ra det l&auml;ttare att reflektera, sortera tankar och vid behov hitta vidare till r&auml;tt
					resurser.
				</p>
			</section>

			<section class="section">
				<h2>V&auml;rdegrund</h2>
				<p>
					MittPsykes v&auml;rdegrund bygger p&aring; integritet, frivillighet och m&auml;nsklig s&aring;rbarhet.
					Anv&auml;ndaren ska kunna m&ouml;tas utan d&ouml;mande ton, utan krav p&aring; att m&aring; b&auml;ttre snabbt och
					utan k&auml;nslan av att bli reducerad till ett symptom. Varje steg ska kunna tas i egen
					takt.
				</p>
			</section>

			<section class="section">
				<h2>Tematiska ing&aring;ngar</h2>
				<p>
					F&ouml;r att skapa tydlighet &auml;r inneh&aring;llet och st&ouml;det organiserat i tematiska ing&aring;ngar:
				</p>
				<ul>
					<li>&Aring;ngest</li>
					<li>Depression</li>
					<li>Trauma &amp; v&aring;ld</li>
				</ul>
				<p>
					De tematiska ing&aring;ngarna g&ouml;r det enklare att hitta ett sammanhang som k&auml;nns relevant
					direkt. I st&auml;llet f&ouml;r att navigera brett kan anv&auml;ndaren b&ouml;rja d&auml;r behovet &auml;r som st&ouml;rst
					och f&aring; st&ouml;d som k&auml;nns mer tr&auml;ffs&auml;kert och begripligt.
				</p>
			</section>

			<section class="section">
				<h2>Design och kontinuitet</h2>
				<p>
					Designfilosofin &auml;r avskalad, mjuk och icke-klinisk. Gr&auml;nssnittet &auml;r medvetet lugnt f&ouml;r
					att minska stress, undvika on&ouml;diga distraktioner och skapa en k&auml;nsla av n&auml;rvaro.
					Typografi, mellanrum och tonalitet &auml;r valda f&ouml;r att g&ouml;ra upplevelsen l&auml;ttl&auml;st och
					omh&auml;ndertagande.
				</p>
				<p>
					MittPsyke kan anv&auml;ndas anonymt f&ouml;r den som vill b&ouml;rja f&ouml;rsiktigt. F&ouml;r den som &ouml;nskar
					mer kontinuitet finns m&ouml;jlighet till inloggning, d&auml;r samtal kan sparas &ouml;ver tid och bli
					en personlig historik av reflektioner. P&aring; s&aring; s&auml;tt kan plattformen fungera som ett
					digitalt samtalsrum, och f&ouml;r vissa &auml;ven som en personlig journal i vardagen.
				</p>
			</section>
		</article>

		<section class="feature-grid" aria-label="Nyckelfunktioner">
			<article class="feature-card">
				<h3>Dagbok</h3>
				<p>En privat plats f&ouml;r reflektion d&auml;r du kan skriva i din egen takt.</p>
			</article>
			<article class="feature-card">
				<h3>Statistik</h3>
				<p>Ett lugnt s&auml;tt att se m&ouml;nster &ouml;ver tid och f&ouml;lja din egen utveckling.</p>
			</article>
			<article class="feature-card">
				<h3>Trygg chat</h3>
				<p>Samtalsst&ouml;d som svarar med respekt, struktur och n&auml;rvaro.</p>
			</article>
		</section>

		<section class="principles-card">
			<h3>Hur MittPsyke ser p&aring; psyket</h3>
			<ul>
				<li>Psyket &auml;r inte trasigt &ndash; det &auml;r ofta &ouml;verbelastat</li>
				<li>&Aring;ngest, depression och stress &auml;r signaler, inte fel</li>
				<li>Tankar, k&auml;nslor och kropp h&auml;nger samman</li>
				<li>Trygghet och f&ouml;rst&aring;else &auml;r ofta f&ouml;rsta steget mot f&ouml;r&auml;ndring</li>
			</ul>
		</section>

		<aside class="info-callout" aria-label="Viktigt att veta">
			<h2>Viktigt att veta</h2>
			<p>
				L&auml;s mer om begr&auml;nsningar och ansvar i
				<a href="/ansvar">Ansvarsinfo</a>.
			</p>
		</aside>
	</div>
</main>

<style>
	.page {
		padding: clamp(2.25rem, 5vw, 3rem) clamp(1rem, 4vw, 1.5rem) clamp(3rem, 7vw, 4rem);
	}

	.page-container {
		max-width: 860px;
		margin: 0 auto;
		display: grid;
		gap: 1.5rem;
	}

	.text-block {
		max-width: 720px;
		margin: 0 auto;
	}

	.section + .section {
		margin-top: 1.8rem;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	h1 {
		margin: 0 0 1rem;
		font-size: clamp(1.9rem, 3.6vw, 2.5rem);
	}

	h2 {
		margin: 0 0 0.8rem;
		font-size: clamp(1.2rem, 2.4vw, 1.45rem);
	}

	h3 {
		margin: 0 0 0.55rem;
		font-size: 1.08rem;
	}

	p,
	li {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.35vw, 1.125rem);
		line-height: 1.65;
	}

	p {
		margin: 0;
	}

	.section p + p {
		margin-top: 1rem;
	}

	ul {
		margin: 0.35rem 0 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.35rem;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.8rem;
	}

	.feature-card,
	.principles-card,
	.info-callout {
		border: 1px solid rgba(15, 23, 42, 0.09);
		border-radius: 16px;
		padding: 1rem;
		background: rgba(248, 250, 252, 0.8);
	}

	.feature-card p,
	.info-callout p {
		font-size: clamp(1rem, 0.95rem + 0.25vw, 1.05rem);
	}

	.principles-card ul {
		margin-top: 0.45rem;
	}

	.info-callout h2 {
		margin-bottom: 0.45rem;
	}

	.info-callout a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	@media (min-width: 760px) {
		.feature-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1rem 2.6rem;
		}

		.section + .section {
			margin-top: 1.5rem;
		}

		p,
		li {
			font-size: 1rem;
		}
	}
</style>
