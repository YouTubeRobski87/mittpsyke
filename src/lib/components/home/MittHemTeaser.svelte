<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowRight,
		BarChart3,
		BookOpen,
		Heart,
		House,
		Leaf,
		Smile,
		Sparkles,
		ToolCase
	} from 'lucide-svelte';
	import {
		getDashboardCompanionScene,
		type DashboardCompanionScene
	} from '$lib/progressCompanion';

	let localScene = $state<DashboardCompanionScene | null>(null);

	onMount(() => {
		localScene = getDashboardCompanionScene(new Date());
	});
</script>

<section id="mitt-hem" class="mitt-hem-teaser" aria-labelledby="mitt-hem-title">
	<div class="cards-narrow mitt-hem-inner">
		<div class="mitt-hem-copy">
			<p class="mitt-hem-label">Din personliga plats</p>
			<h2 id="mitt-hem-title">Ett tryggt hem för ditt mående</h2>
			<p class="mitt-hem-intro">
				När du skapar ett konto får du ett eget lugnt utrymme där du kan följa ditt mående,
				samla dina framsteg och återvända när du behöver stöd.
			</p>
			<div class="mitt-hem-actions">
				<a class="mitt-hem-cta mitt-hem-cta-primary" href="/register">
					Skapa ditt hem
				</a>
				<a class="mitt-hem-cta mitt-hem-cta-secondary" href="/login">Logga in</a>
			</div>
			<p class="mitt-hem-note">Privat, personligt och skapat för att kännas tryggt.</p>
		</div>

		<div class="mitt-hem-preview-wrap">
			<div class="mitt-hem-preview-float">
				<div class="mitt-hem-window" aria-label="Förhandsvisning av Mitt hem">
					<div class="mitt-hem-window-bar" aria-hidden="true">
						<span class="window-dots">
							<i></i>
							<i></i>
							<i></i>
						</span>
						<span class="window-pill">mittpsyke.se/mitt-hem</span>
					</div>

					<div class="mitt-hem-window-body">
						<div class="mitt-hem-shell">
							<aside class="mitt-hem-sidebar" aria-hidden="true">
								<div class="sidebar-brand">
									<span class="brand-mark">
										<Leaf size={17} strokeWidth={2} />
									</span>
									<span>MittPsyke</span>
								</div>

								<nav class="sidebar-nav">
									<span class="sidebar-link is-active"><House size={16} /> Hem</span>
									<span class="sidebar-link"><Smile size={16} /> Mående</span>
									<span class="sidebar-link"><BookOpen size={16} /> Dagbok</span>
									<span class="sidebar-link"><ToolCase size={16} /> Verktyg</span>
									<span class="sidebar-link"><BarChart3 size={16} /> Framsteg</span>
								</nav>

								<div class="sidebar-support">
									<strong>Du är inte ensam.</strong>
									<small>Vi finns här för dig.</small>
								</div>
							</aside>

							<div class="mitt-hem-main">
								<header class="preview-topbar">
									<div>
										<h3>Välkommen tillbaka</h3>
										<p>Hur mår du idag?</p>
									</div>
									<span class="preview-avatar" aria-hidden="true">M</span>
								</header>

								<section class="preview-hero">
									{#if localScene}
										<img
											src={localScene.imageSrc}
											alt={localScene.alt}
											loading="lazy"
											decoding="async"
											width="1200"
											height="640"
										/>
									{/if}
									<div class="preview-hero-copy">
										<h4>Din följeslagare</h4>
										<p>Den finns kvar här när du återvänder.</p>
										<span class="hero-heart">
											<Heart size={18} fill="currentColor" strokeWidth={0} />
										</span>
									</div>
									<div class="preview-greeting" aria-live="polite">
										<Sparkles size={16} aria-hidden="true" />
										<div>
											<strong>{localScene?.greeting.label ?? 'Välkommen'}</strong>
											<small>{localScene?.greeting.note ?? 'Din plats finns här.'}</small>
										</div>
									</div>
								</section>

								<div class="preview-card-row">
									<article class="preview-card preview-card-mood">
										<div class="preview-card-head">
											<div>
												<h4>Ditt mående idag</h4>
												<p>Hur känner du dig just nu?</p>
											</div>
											<Smile size={16} aria-hidden="true" />
										</div>
										<div class="preview-mood-face" aria-hidden="true">
											<span class="preview-eye left"></span>
											<span class="preview-eye right"></span>
											<span class="preview-mouth"></span>
										</div>
										<strong class="preview-mood-label">En liten stund i taget</strong>
										<span class="preview-button">
											Uppdatera mående
											<ArrowRight size={14} aria-hidden="true" />
										</span>
									</article>

									<article class="preview-card preview-card-progress">
										<div class="preview-card-head">
											<div>
												<h4>Dina insikter</h4>
												<p>Små steg kan få synas här.</p>
											</div>
											<BarChart3 size={16} aria-hidden="true" />
										</div>
										<ul class="preview-insights">
											<li>Reflektioner samlas lugnt över tid.</li>
											<li>Ditt mående kan bli lättare att följa.</li>
											<li>Platsen väntar när du kommer tillbaka.</li>
										</ul>
									</article>
								</div>

								<div class="preview-lower">
									<article class="preview-lower-card preview-activity">
										<h4>Senaste aktivitet</h4>
										<ul>
											<li>
												<span class="activity-dot green"></span>
												<span>Dagbok och reflektion finns nära till hands.</span>
											</li>
											<li>
												<span class="activity-dot lilac"></span>
												<span>Små framsteg kan få ligga kvar här.</span>
											</li>
										</ul>
									</article>

									<article class="preview-lower-card preview-quote">
										<p>Det räcker att du är här.</p>
										<small>En liten stund i taget.</small>
									</article>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.mitt-hem-teaser {
		padding: clamp(2.7rem, 7vw, 4.7rem) 1.25rem;
		background:
			radial-gradient(960px 420px at 8% 8%, rgba(227, 236, 218, 0.72), transparent 64%),
			radial-gradient(840px 380px at 100% 100%, rgba(255, 241, 214, 0.5), transparent 62%),
			linear-gradient(180deg, #f8f5ef 0%, #f6f1e7 100%);
		color: #1f2f22;
	}

	.mitt-hem-inner {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(1.5rem, 4vw, 3rem);
		align-items: center;
	}

	.mitt-hem-copy {
		max-width: 34rem;
	}

	.mitt-hem-label {
		margin: 0 0 0.55rem;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #54734e;
	}

	.mitt-hem-copy h2 {
		margin: 0;
		color: #243726;
		font-size: clamp(1.65rem, 3.5vw, 2.4rem);
		line-height: 1.08;
	}

	.mitt-hem-intro {
		margin: 0.85rem 0 0;
		max-width: 34rem;
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.72;
		color: rgba(40, 54, 42, 0.84);
	}

	.mitt-hem-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin-top: 1.35rem;
	}

	.mitt-hem-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.9rem;
		padding: 0.78rem 1.2rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-heading);
		font-size: 0.93rem;
		font-weight: 700;
		text-decoration: none;
		transition:
			transform 0.16s ease,
			box-shadow 0.16s ease,
			background 0.16s ease,
			border-color 0.16s ease;
	}

	.mitt-hem-cta-primary {
		background: #3f7f53;
		color: #ffffff;
		box-shadow: 0 10px 24px rgba(63, 127, 83, 0.18);
	}

	.mitt-hem-cta-secondary {
		border: 1px solid rgba(70, 100, 74, 0.18);
		background: rgba(255, 255, 255, 0.7);
		color: #32543a;
	}

	.mitt-hem-cta:hover,
	.mitt-hem-cta:focus-visible {
		transform: translateY(-1px);
	}

	.mitt-hem-cta-primary:hover,
	.mitt-hem-cta-primary:focus-visible {
		box-shadow: 0 14px 28px rgba(63, 127, 83, 0.22);
	}

	.mitt-hem-cta-secondary:hover,
	.mitt-hem-cta-secondary:focus-visible {
		background: rgba(255, 255, 255, 0.88);
		border-color: rgba(70, 100, 74, 0.28);
	}

	.mitt-hem-note {
		margin: 1rem 0 0;
		font-size: 0.9rem;
		line-height: 1.6;
		color: rgba(49, 67, 52, 0.76);
	}

	.mitt-hem-preview-wrap {
		position: relative;
		min-width: 0;
		padding: clamp(0.6rem, 1.8vw, 1.15rem);
		border-radius: clamp(28px, 3vw, 36px);
		background:
			radial-gradient(110% 95% at 0% 0%, rgba(238, 244, 232, 0.84), transparent 58%),
			radial-gradient(95% 90% at 100% 100%, rgba(255, 245, 224, 0.9), transparent 54%),
			linear-gradient(180deg, rgba(255, 251, 245, 0.96), rgba(244, 238, 227, 0.92));
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.72),
			0 20px 44px rgba(91, 77, 53, 0.08);
		isolation: isolate;
	}

	.mitt-hem-preview-wrap::before {
		content: '';
		position: absolute;
		inset: 8% 4% -4%;
		border-radius: inherit;
		background: radial-gradient(70% 70% at 50% 18%, rgba(255, 255, 255, 0.5), transparent 68%);
		filter: blur(18px);
		opacity: 0.78;
		z-index: 0;
		pointer-events: none;
	}

	.mitt-hem-preview-wrap::after {
		content: '';
		position: absolute;
		inset: 10% 8% 12%;
		border-radius: 32px;
		background:
			radial-gradient(58% 52% at 50% 42%, rgba(223, 236, 214, 0.34), transparent 72%),
			radial-gradient(44% 36% at 55% 52%, rgba(255, 247, 230, 0.4), transparent 76%);
		filter: blur(22px);
		opacity: 0.92;
		z-index: 0;
		pointer-events: none;
	}

	.mitt-hem-preview-float {
		position: relative;
		z-index: 1;
	}

	.mitt-hem-window {
		overflow: hidden;
		border-radius: clamp(24px, 2.8vw, 32px);
		border: 1px solid rgba(88, 112, 78, 0.12);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(252, 250, 245, 0.98));
		box-shadow:
			0 36px 90px rgba(55, 68, 49, 0.16),
			0 14px 32px rgba(55, 68, 49, 0.08),
			0 1px 0 rgba(255, 255, 255, 0.7) inset;
	}

	.mitt-hem-window-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.8rem 1rem;
		border-bottom: 1px solid rgba(81, 104, 73, 0.1);
		background: rgba(253, 250, 243, 0.88);
	}

	.window-dots {
		display: inline-flex;
		gap: 0.38rem;
	}

	.window-dots i {
		width: 0.58rem;
		height: 0.58rem;
		border-radius: 999px;
		background: rgba(105, 131, 97, 0.42);
	}

	.window-pill {
		padding: 0.38rem 0.8rem;
		border-radius: 999px;
		background: rgba(242, 239, 228, 0.92);
		color: rgba(58, 75, 57, 0.78);
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.03em;
	}

	.mitt-hem-window-body {
		position: relative;
		max-height: clamp(25rem, 52vw, 31rem);
		overflow: hidden;
		background:
			radial-gradient(820px 340px at 0% 0%, rgba(235, 243, 229, 0.82), transparent 58%),
			linear-gradient(180deg, #fffdf9 0%, #f7f2e8 100%);
	}

	.mitt-hem-window-body::after {
		content: '';
		position: absolute;
		inset: auto 0 0;
		height: 5.75rem;
		background: linear-gradient(180deg, rgba(247, 242, 232, 0), rgba(247, 242, 232, 0.97) 72%);
		pointer-events: none;
	}

	.mitt-hem-shell {
		display: grid;
		grid-template-columns: 5.6rem minmax(0, 1fr);
		min-height: 34rem;
	}

	.mitt-hem-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 0.85rem;
		border-right: 1px solid rgba(81, 104, 73, 0.09);
		background: rgba(255, 252, 246, 0.82);
	}

	.sidebar-brand {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.78rem;
		font-weight: 700;
		color: #375338;
	}

	.brand-mark {
		display: grid;
		place-items: center;
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 999px;
		background: rgba(225, 239, 220, 0.9);
		color: #4a8253;
		flex: 0 0 auto;
	}

	.sidebar-nav {
		display: grid;
		gap: 0.35rem;
	}

	.sidebar-link {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.55rem 0.6rem;
		border-radius: 12px;
		color: rgba(55, 72, 54, 0.82);
		font-size: 0.72rem;
		font-weight: 600;
	}

	.sidebar-link.is-active {
		background: linear-gradient(135deg, rgba(226, 242, 220, 0.95), rgba(244, 250, 238, 0.82));
		color: #2d5a35;
	}

	.sidebar-support {
		margin-top: auto;
		display: grid;
		gap: 0.2rem;
		padding: 0.8rem 0.7rem;
		border-radius: 16px;
		border: 1px solid rgba(92, 110, 86, 0.1);
		background: rgba(255, 255, 255, 0.7);
	}

	.sidebar-support strong {
		font-size: 0.72rem;
		color: #314434;
	}

	.sidebar-support small {
		font-size: 0.66rem;
		color: rgba(49, 67, 52, 0.72);
		line-height: 1.45;
	}

	.mitt-hem-main {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1rem;
	}

	.preview-topbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.9rem;
		padding-bottom: 0.15rem;
	}

	.preview-topbar h3 {
		margin: 0;
		font-size: clamp(1rem, 1.7vw, 1.4rem);
		line-height: 1.1;
		color: #243726;
	}

	.preview-topbar p {
		margin: 0.35rem 0 0;
		font-size: 0.82rem;
		color: rgba(44, 58, 45, 0.72);
	}

	.preview-avatar {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: #e0eed8;
		color: #3e7146;
		font-family: var(--font-heading);
		font-size: 0.88rem;
		font-weight: 700;
		flex: 0 0 auto;
	}

	.preview-hero {
		position: relative;
		min-height: clamp(11rem, 22vw, 14rem);
		overflow: hidden;
		border-radius: 22px;
		border: 1px solid rgba(255, 255, 255, 0.78);
		background:
			linear-gradient(135deg, #f8f4eb 0%, #edf4e7 55%, #dce8e2 100%);
		box-shadow:
			0 18px 42px rgba(81, 94, 73, 0.08),
			0 1px 0 rgba(255, 255, 255, 0.45) inset;
	}

	.preview-hero img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 70% 64%;
		display: block;
	}

	.preview-hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(90deg, rgba(255, 252, 245, 0.92) 0%, rgba(255, 252, 245, 0.62) 34%, rgba(255, 252, 245, 0.12) 56%, transparent 74%);
		z-index: 1;
	}

	.preview-hero-copy {
		position: relative;
		z-index: 2;
		display: grid;
		gap: 0.45rem;
		max-width: min(15rem, 48%);
		padding: 1.15rem;
	}

	.preview-hero-copy h4,
	.preview-card h4,
	.preview-lower-card h4 {
		margin: 0;
		font-size: 0.98rem;
		color: #243726;
	}

	.preview-hero-copy p,
	.preview-card-head p {
		margin: 0;
		font-size: 0.77rem;
		line-height: 1.5;
		color: rgba(47, 60, 47, 0.72);
	}

	.hero-heart {
		color: #83c894;
	}

	.preview-greeting {
		position: absolute;
		top: 0.9rem;
		right: 0.9rem;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.6rem 0.72rem;
		border-radius: 14px;
		background: rgba(255, 252, 245, 0.95);
		border: 1px solid rgba(220, 207, 176, 0.56);
		box-shadow: 0 10px 24px rgba(81, 94, 73, 0.08);
		color: #d39d24;
	}

	.preview-greeting strong,
	.preview-greeting small {
		display: block;
	}

	.preview-greeting strong {
		font-size: 0.78rem;
		color: #243726;
	}

	.preview-greeting small {
		font-size: 0.68rem;
		color: rgba(47, 60, 47, 0.68);
	}

	.preview-card-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}

	.preview-card,
	.preview-lower-card {
		border-radius: 18px;
		border: 1px solid rgba(84, 108, 83, 0.08);
		background: rgba(255, 255, 255, 0.82);
		box-shadow:
			0 10px 24px rgba(81, 94, 73, 0.05),
			0 1px 0 rgba(255, 255, 255, 0.45) inset;
	}

	.preview-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 10rem;
		padding: 0.95rem;
	}

	.preview-card-mood {
		background: linear-gradient(145deg, rgba(234, 248, 230, 0.92), rgba(255, 255, 252, 0.82));
	}

	.preview-card-progress {
		background: linear-gradient(145deg, rgba(245, 239, 252, 0.9), rgba(255, 252, 255, 0.88));
	}

	.preview-card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.65rem;
		color: #4b8254;
	}

	.preview-card-progress .preview-card-head {
		color: #8b6ccb;
	}

	.preview-mood-face {
		position: relative;
		width: 3.35rem;
		height: 3.35rem;
		margin: 0 auto;
		border-radius: 50%;
		background: #bfe6bd;
		box-shadow: inset 0 0 0 0.4rem rgba(91, 182, 98, 0.16);
	}

	.preview-eye {
		position: absolute;
		top: 1.3rem;
		width: 0.24rem;
		height: 0.24rem;
		border-radius: 999px;
		background: #35974a;
	}

	.preview-eye.left {
		left: 1.16rem;
	}

	.preview-eye.right {
		right: 1.16rem;
	}

	.preview-mouth {
		position: absolute;
		left: 1.08rem;
		top: 1.83rem;
		width: 1rem;
		height: 0.48rem;
		border-bottom: 0.18rem solid #35974a;
		border-radius: 0 0 999px 999px;
	}

	.preview-mood-label {
		text-align: center;
		font-size: 0.78rem;
		line-height: 1.45;
		color: #2f6f40;
	}

	.preview-button {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		min-height: 2rem;
		padding: 0.45rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(63, 127, 83, 0.16);
		background: rgba(255, 255, 255, 0.72);
		font-size: 0.74rem;
		font-weight: 700;
		color: #356944;
	}

	.preview-insights {
		margin: 0;
		padding: 0 0 0 1rem;
		color: rgba(58, 49, 84, 0.76);
		font-size: 0.74rem;
		line-height: 1.6;
	}

	.preview-lower {
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		gap: 0.8rem;
		padding-top: 0.25rem;
		transform: translateY(0.2rem);
		opacity: 0.96;
	}

	.preview-lower-card {
		min-height: 8.9rem;
		padding: 0.95rem;
	}

	.preview-activity ul {
		display: grid;
		gap: 0.65rem;
		margin: 0.85rem 0 0;
		padding: 0;
		list-style: none;
	}

	.preview-activity li {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		font-size: 0.74rem;
		line-height: 1.5;
		color: rgba(48, 61, 47, 0.76);
	}

	.activity-dot {
		width: 0.55rem;
		height: 0.55rem;
		margin-top: 0.26rem;
		border-radius: 999px;
		flex: 0 0 auto;
	}

	.activity-dot.green {
		background: #7fc68d;
	}

	.activity-dot.lilac {
		background: #c4a5ff;
	}

	.preview-quote {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		background:
			linear-gradient(180deg, rgba(255, 248, 229, 0.95), rgba(255, 252, 243, 0.94)),
			#fff8ed;
	}

	.preview-quote p {
		margin: 0;
		font-size: 0.98rem;
		line-height: 1.45;
		color: #324235;
	}

	.preview-quote small {
		margin-top: 0.4rem;
		font-size: 0.74rem;
		color: rgba(50, 66, 53, 0.72);
	}

	@media (min-width: 1040px) {
		.mitt-hem-inner {
			grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		}
	}

	@media (hover: hover) and (prefers-reduced-motion: no-preference) {
		.mitt-hem-preview-float {
			transition:
				transform 220ms ease,
				filter 220ms ease;
		}

		.mitt-hem-preview-float:hover {
			transform: translateY(-5px);
			filter: drop-shadow(0 18px 30px rgba(69, 79, 55, 0.08));
		}
	}

	@media (max-width: 820px) {
		.mitt-hem-preview-wrap {
			padding: 0.8rem;
		}

		.mitt-hem-window-body {
			max-height: 29rem;
		}

		.mitt-hem-shell {
			grid-template-columns: 4.8rem minmax(0, 1fr);
		}

		.preview-lower {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 620px) {
		.mitt-hem-preview-wrap {
			padding: 0.55rem;
			border-radius: 24px;
		}

		.mitt-hem-preview-wrap::after {
			inset: 12% 7% 13%;
			filter: blur(18px);
			opacity: 0.82;
		}

		.mitt-hem-window-body {
			max-height: 25.5rem;
		}

		.mitt-hem-shell {
			grid-template-columns: 1fr;
		}

		.mitt-hem-sidebar {
			padding: 0.8rem 0.8rem 0;
			border-right: 0;
			border-bottom: 1px solid rgba(81, 104, 73, 0.08);
			background: transparent;
		}

		.sidebar-nav {
			grid-template-columns: repeat(5, minmax(0, 1fr));
			gap: 0.35rem;
		}

		.sidebar-link {
			justify-content: center;
			padding: 0.55rem 0.3rem;
			font-size: 0;
		}

		.sidebar-link :global(svg) {
			width: 15px;
			height: 15px;
		}

		.sidebar-support {
			display: none;
		}

		.mitt-hem-main {
			padding-top: 0.8rem;
		}

		.preview-topbar h3 {
			font-size: 1.05rem;
		}

		.preview-hero {
			min-height: 10.5rem;
		}

		.preview-hero-copy {
			max-width: 52%;
			padding: 0.95rem;
		}

		.preview-greeting {
			top: 0.55rem;
			right: 0.55rem;
			padding: 0.45rem 0.58rem;
		}

		.preview-card-row {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 420px) {
		.mitt-hem-teaser {
			padding-inline: 1rem;
		}

		.mitt-hem-preview-wrap {
			padding: 0.45rem;
		}

		.mitt-hem-preview-wrap::after {
			inset: 13% 6% 14%;
			filter: blur(16px);
		}

		.mitt-hem-actions {
			flex-direction: column;
		}

		.mitt-hem-cta {
			width: 100%;
		}

		.mitt-hem-window-body {
			max-height: 24.75rem;
		}

		.window-pill {
			max-width: 10rem;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.preview-hero-copy {
			max-width: 56%;
		}

		.preview-hero-copy h4 {
			font-size: 0.88rem;
		}

		.preview-hero-copy p,
		.preview-card-head p,
		.preview-insights,
		.preview-activity li,
		.preview-quote small {
			font-size: 0.7rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mitt-hem-cta,
		.mitt-hem-preview-float {
			transition: none;
			transform: none !important;
		}
	}
</style>
