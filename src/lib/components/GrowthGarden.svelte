<script lang="ts">
	export let growthScore: number;
	export let growthLevel: number;
	export let entryCount: number = 0;
	export let activeDays: number = 0;
</script>

<section class="garden-card card" aria-labelledby="growth-garden-title" data-growth-score={growthScore}>
	<div class="garden-copy">
		<h2 id="growth-garden-title">Din plats</h2>
		<p class="garden-intro">Här syns det som vuxit fram över tid. Små steg får också ta plats.</p>
	</div>

	<div class="garden-scene" aria-hidden="true">
		<svg viewBox="0 0 480 220" role="presentation" focusable="false">
			<defs>
				<linearGradient id="gardenSky" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-sky-top)" />
					<stop offset="100%" stop-color="var(--garden-sky-bottom)" />
				</linearGradient>
				<linearGradient id="gardenGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-ground-top)" />
					<stop offset="100%" stop-color="var(--garden-ground-bottom)" />
				</linearGradient>
				<linearGradient id="gardenBush" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-bush-top)" />
					<stop offset="100%" stop-color="var(--garden-bush-bottom)" />
				</linearGradient>
				<linearGradient id="gardenTree" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-leaf-top)" />
					<stop offset="100%" stop-color="var(--garden-leaf-bottom)" />
				</linearGradient>
			</defs>

			<rect x="0" y="0" width="480" height="220" rx="28" fill="url(#gardenSky)" />
			<ellipse cx="102" cy="52" rx="56" ry="18" class="mist" />
			<ellipse cx="372" cy="42" rx="74" ry="22" class="mist" />
			<path
				d="M0 160 C60 146 120 150 182 162 S310 176 480 150 L480 220 L0 220 Z"
				fill="url(#gardenGround)"
			/>
			<path
				d="M0 174 C74 162 134 168 202 178 S342 190 480 166 L480 220 L0 220 Z"
				class="ground-shadow"
			/>

			{#if growthLevel >= 1}
				<g class="layer grass">
					<path d="M64 170 C69 152 73 144 76 170" />
					<path d="M98 176 C103 156 108 148 112 176" />
					<path d="M132 170 C136 150 142 142 146 170" />
					<path d="M310 176 C316 154 320 146 324 176" />
					<path d="M344 170 C350 150 356 142 360 170" />
					<path d="M382 176 C386 156 392 148 396 176" />
				</g>
			{/if}

			{#if growthLevel >= 2}
				<g class="layer flowers">
					<g transform="translate(156 168)">
						<path d="M0 0 L0 -18" class="stem" />
						<circle cx="0" cy="-21" r="6" class="flower-core" />
						<circle cx="-6" cy="-21" r="4" class="flower-petal" />
						<circle cx="6" cy="-21" r="4" class="flower-petal" />
						<circle cx="0" cy="-27" r="4" class="flower-petal" />
						<circle cx="0" cy="-15" r="4" class="flower-petal" />
					</g>
					<g transform="translate(214 176)">
						<path d="M0 0 L0 -15" class="stem" />
						<circle cx="0" cy="-18" r="5" class="flower-core" />
						<circle cx="-5" cy="-18" r="3.5" class="flower-petal-alt" />
						<circle cx="5" cy="-18" r="3.5" class="flower-petal-alt" />
						<circle cx="0" cy="-23" r="3.5" class="flower-petal-alt" />
						<circle cx="0" cy="-13" r="3.5" class="flower-petal-alt" />
					</g>
					<g transform="translate(336 170)">
						<path d="M0 0 L0 -17" class="stem" />
						<circle cx="0" cy="-20" r="5.5" class="flower-core" />
						<circle cx="-5.5" cy="-20" r="3.8" class="flower-petal" />
						<circle cx="5.5" cy="-20" r="3.8" class="flower-petal" />
						<circle cx="0" cy="-25.5" r="3.8" class="flower-petal" />
						<circle cx="0" cy="-14.5" r="3.8" class="flower-petal" />
					</g>
				</g>
			{/if}

			{#if growthLevel >= 3}
				<g class="layer bush">
					<ellipse cx="128" cy="164" rx="34" ry="20" fill="url(#gardenBush)" />
					<ellipse cx="164" cy="160" rx="28" ry="18" fill="url(#gardenBush)" />
					<ellipse cx="148" cy="150" rx="30" ry="22" fill="url(#gardenBush)" />
				</g>
			{/if}

			{#if growthLevel >= 4}
				<g class="layer tree">
					<rect x="312" y="106" width="14" height="60" rx="7" class="trunk" />
					<ellipse cx="300" cy="108" rx="34" ry="28" fill="url(#gardenTree)" />
					<ellipse cx="334" cy="104" rx="30" ry="26" fill="url(#gardenTree)" />
					<ellipse cx="318" cy="84" rx="38" ry="30" fill="url(#gardenTree)" />
				</g>
			{/if}
		</svg>
	</div>

	<div class="garden-meta">
		<p class="garden-note">Baserat på dina inlägg och dagar du kommit tillbaka.</p>
		<p class="garden-stats">{entryCount} inlägg och {activeDays} aktiva dagar totalt.</p>
	</div>
</section>

<style>
	.garden-card {
		--garden-sky-top: color-mix(in srgb, hsl(var(--surface)) 76%, white 24%);
		--garden-sky-bottom: color-mix(in srgb, hsl(var(--surface-soft)) 92%, white 8%);
		--garden-ground-top: color-mix(in srgb, var(--theme-accent, #0f766e) 22%, hsl(var(--surface-soft)) 78%);
		--garden-ground-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 34%, hsl(var(--surface)) 66%);
		--garden-bush-top: color-mix(in srgb, var(--theme-accent, #0f766e) 46%, #7f9b83 54%);
		--garden-bush-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 60%, #4f6d55 40%);
		--garden-leaf-top: color-mix(in srgb, var(--theme-accent, #0f766e) 48%, #8aa377 52%);
		--garden-leaf-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 62%, #556e4f 38%);
		padding: 2rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		display: grid;
		gap: 1rem;
		overflow: hidden;
	}

	.garden-copy {
		display: grid;
		gap: 0.45rem;
	}

	.garden-copy h2,
	.garden-intro,
	.garden-note,
	.garden-stats {
		margin: 0;
	}

	.garden-copy h2 {
		font-size: 1.3rem;
		color: hsl(var(--foreground));
	}

	.garden-intro {
		max-width: 42rem;
		font-size: 0.98rem;
		line-height: 1.7;
		color: hsl(var(--muted-foreground));
	}

	.garden-scene {
		width: 100%;
		min-height: 220px;
		border-radius: 1.1rem;
		overflow: hidden;
		background: color-mix(in srgb, hsl(var(--surface-soft)) 92%, white 8%);
		border: 1px solid hsl(var(--border));
	}

	.garden-scene svg {
		display: block;
		width: 100%;
		height: auto;
		min-height: 220px;
	}

	.mist {
		fill: rgba(255, 255, 255, 0.35);
	}

	.ground-shadow {
		fill: rgba(42, 56, 49, 0.08);
	}

	.layer {
		animation: gardenFade 320ms ease-out both;
	}

	.grass path {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #0f766e) 48%, #5d735e 52%);
		stroke-width: 3.4;
		stroke-linecap: round;
	}

	.stem {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #0f766e) 45%, #69806f 55%);
		stroke-width: 2.4;
		stroke-linecap: round;
	}

	.flower-core {
		fill: color-mix(in srgb, #f2ddba 78%, white 22%);
	}

	.flower-petal {
		fill: color-mix(in srgb, #e4d8cb 80%, white 20%);
	}

	.flower-petal-alt {
		fill: color-mix(in srgb, #d9d8e4 78%, white 22%);
	}

	.trunk {
		fill: color-mix(in srgb, #6b5849 82%, #3f3027 18%);
	}

	.garden-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		align-items: center;
		justify-content: space-between;
	}

	.garden-note,
	.garden-stats {
		font-size: 0.84rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	.garden-stats {
		white-space: nowrap;
	}

	@keyframes gardenFade {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.dark) .garden-card {
		--garden-sky-top: color-mix(in srgb, hsl(var(--surface)) 82%, #14202a 18%);
		--garden-sky-bottom: color-mix(in srgb, hsl(var(--surface-soft)) 86%, #101821 14%);
	}

	:global(.dark) .mist {
		fill: rgba(226, 232, 240, 0.12);
	}

	:global(.dark) .ground-shadow {
		fill: rgba(7, 12, 15, 0.26);
	}

	:global(.dark) .garden-scene {
		background: color-mix(in srgb, hsl(var(--surface-soft)) 88%, #0f1720 12%);
	}

	@media (max-width: 640px) {
		.garden-card {
			padding: 1.5rem;
			gap: 0.9rem;
		}

		.garden-copy h2 {
			font-size: 1.18rem;
		}

		.garden-intro {
			font-size: 0.93rem;
		}

		.garden-scene,
		.garden-scene svg {
			min-height: 190px;
		}

		.garden-meta {
			flex-direction: column;
			align-items: flex-start;
		}

		.garden-stats {
			white-space: normal;
		}
	}
</style>
