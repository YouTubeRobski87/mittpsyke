<script lang="ts">
	const sections = [
		{
			kicker: 'Grunderna',
			title: 'Förstå ditt mående',
			items: [
				{ ico: '🧠', label: 'Vad är ångest?', href: '/angest', desc: 'Lär dig känna igen och hantera ångest.' },
				{ ico: '🌧', label: 'Depression & nedstämdhet', href: '/depression', desc: 'Skillnaden mellan att vara ledsen och deprimerad.' },
				{ ico: '💨', label: 'Stress och oro', href: '/stress', desc: 'Hur kroppen reagerar på stress och vad du kan göra.' },
				{ ico: '🤝', label: 'Ensamhet', href: '/ensamhet', desc: 'Att navigera ensamhet på ett mänskligt sätt.' }
			]
		},
		{
			kicker: 'Verktyg',
			title: 'Övningar & tekniker',
			items: [
				{ ico: '🌬', label: '4-7-8-andning', href: '/4-7-8-andning-ovning', desc: 'En enkel andningsteknik mot stress och oro.' },
				{ ico: '🧩', label: 'Alla övningar', href: '/ovningar', desc: 'Samling av guidade övningar för psykisk hälsa.' },
				{ ico: '📓', label: 'Journalföring', href: '/journalforing', desc: 'Hur du skriver dagbok på ett reflekterande sätt.' },
				{ ico: '😌', label: 'Självkänsla', href: '/sjalvkansla', desc: 'Bygg en stabil relation till dig själv.' }
			]
		},
		{
			kicker: 'Fördjupning',
			title: 'Guider & artiklar',
			items: [
				{ ico: '📚', label: 'Alla guider', href: '/guider', desc: 'Fördjupa dig i psykisk hälsa med expertguider.' },
				{ ico: '✍️', label: 'Dagbok online', href: '/anonym-dagbok-online', desc: 'Allt om anonym dagbok och vad forskningen säger.' },
				{ ico: '💬', label: 'KBT-dagbok', href: '/kbt', desc: 'Dagboksmetoder inspirerade av KBT.' },
				{ ico: '🗣', label: 'Berättelser', href: '/anonyma-berattelser', desc: 'Läs hur andra hanterat liknande situationer.' }
			]
		}
	];
</script>

<div class="mp-dashboard">
	<div class="shell">
		<main class="main">
			<header class="page-header">
				<div>
					<div class="kicker">Lär dig mer</div>
					<h1>Kreatörsakademin</h1>
					<p class="lead">Fördjupa dig i psykisk hälsa, övningar och tekniker — i din takt.</p>
				</div>
			</header>

			{#each sections as section}
				<section class="section">
					<div class="section-header">
						<span class="kicker">{section.kicker}</span>
						<h2>{section.title}</h2>
					</div>
					<div class="card-grid">
						{#each section.items as item}
							<a href={item.href} class="item-card">
								<span class="ico">{item.ico}</span>
								<div>
									<h3>{item.label}</h3>
									<p>{item.desc}</p>
								</div>
								<span class="arrow">→</span>
							</a>
						{/each}
					</div>
				</section>
			{/each}
		</main>
	</div>
</div>

<style>
	.mp-dashboard {
		--mp-lila: #a882ff;
		--mp-lila-2: #7c5cff;
		--mp-card: rgba(255, 255, 255, 0.04);
		--mp-card-border: rgba(168, 130, 255, 0.14);
		--mp-text: #e8e6f0;
		--mp-text-dim: #9a98ad;
		--mp-radius: 18px;

		color: var(--mp-text);
		min-height: 100vh;
		padding: 28px;
		background:
			radial-gradient(1200px 600px at 80% -10%, rgba(124, 92, 255, 0.18), transparent 60%),
			radial-gradient(900px 500px at 10% 110%, rgba(168, 130, 255, 0.14), transparent 55%),
			linear-gradient(160deg, #0a0a14, #11101f 60%, #0d0b1a);
	}
	.shell {
		max-width: 1040px; margin: 0 auto;
		display: block;
	}
	.main { display: flex; flex-direction: column; gap: 28px; }

	.page-header {
		background: var(--mp-card); border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius); padding: 26px 28px; backdrop-filter: blur(14px);
	}
	.kicker {
		font-size: 0.76rem; letter-spacing: 0.06em;
		text-transform: uppercase; color: var(--mp-lila); margin-bottom: 4px;
	}
	.page-header h1 { font-size: 1.7rem; margin: 0 0 4px; font-weight: 700; }
	.lead { font-size: 0.88rem; color: var(--mp-text-dim); margin: 0; }

	.section { display: flex; flex-direction: column; gap: 14px; }
	.section-header { display: flex; flex-direction: column; gap: 2px; padding: 0 2px; }
	.section-header h2 { margin: 0; font-size: 1.05rem; font-weight: 700; }

	.card-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }

	.item-card {
		display: flex; align-items: flex-start; gap: 14px;
		background: var(--mp-card); border: 1px solid var(--mp-card-border);
		border-radius: 14px; padding: 16px 18px;
		text-decoration: none; color: var(--mp-text);
		backdrop-filter: blur(14px); transition: .15s;
	}
	.item-card:hover {
		background: rgba(168,130,255,0.08);
		border-color: rgba(168,130,255,0.3);
		transform: translateY(-1px);
	}
	.item-card .ico { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
	.item-card div { flex: 1; }
	.item-card h3 { margin: 0 0 4px; font-size: 0.92rem; font-weight: 600; }
	.item-card p { margin: 0; font-size: 0.81rem; color: var(--mp-text-dim); line-height: 1.4; }
	.arrow { color: var(--mp-text-dim); font-size: 1rem; margin-top: 4px; flex-shrink: 0; }

	@media (max-width: 880px) {
		.shell { grid-template-columns: 1fr; }
		.card-grid { grid-template-columns: 1fr; }
	}
</style>
