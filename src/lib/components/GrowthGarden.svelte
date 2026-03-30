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
		<svg viewBox="0 0 520 248" role="presentation" focusable="false">
			<defs>
				<linearGradient id="gardenSky" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-sky-top)" />
					<stop offset="56%" stop-color="var(--garden-sky-mid)" />
					<stop offset="100%" stop-color="var(--garden-sky-bottom)" />
				</linearGradient>
				<linearGradient id="gardenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-glow-start)" />
					<stop offset="100%" stop-color="var(--garden-glow-end)" />
				</linearGradient>
				<linearGradient id="gardenBackGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-back-ground-top)" />
					<stop offset="100%" stop-color="var(--garden-back-ground-bottom)" />
				</linearGradient>
				<linearGradient id="gardenGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-ground-top)" />
					<stop offset="100%" stop-color="var(--garden-ground-bottom)" />
				</linearGradient>
				<linearGradient id="gardenFrontGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-front-ground-top)" />
					<stop offset="100%" stop-color="var(--garden-front-ground-bottom)" />
				</linearGradient>
				<linearGradient id="gardenBush" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-bush-top)" />
					<stop offset="100%" stop-color="var(--garden-bush-bottom)" />
				</linearGradient>
				<linearGradient id="gardenTreeFoliage" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-leaf-top)" />
					<stop offset="100%" stop-color="var(--garden-leaf-bottom)" />
				</linearGradient>
				<linearGradient id="gardenTrunk" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-trunk-top)" />
					<stop offset="100%" stop-color="var(--garden-trunk-bottom)" />
				</linearGradient>
			</defs>

			<rect x="0" y="0" width="520" height="248" rx="30" fill="url(#gardenSky)" />
			<ellipse cx="402" cy="26" rx="118" ry="74" fill="url(#gardenGlow)" class="glow" />
			<path
				d="M0 134 C58 118 112 114 168 122 S286 142 354 132 S462 114 520 126 L520 248 L0 248 Z"
				class="horizon"
			/>
			<ellipse cx="122" cy="74" rx="96" ry="20" class="mist mist-left" />
			<ellipse cx="356" cy="92" rx="132" ry="26" class="mist mist-right" />

			<path
				d="M0 162 C72 146 128 148 190 160 S318 180 402 166 S474 150 520 154 L520 248 L0 248 Z"
				fill="url(#gardenBackGround)"
			/>
			<path
				d="M0 180 C74 164 144 166 220 180 S374 204 520 176 L520 248 L0 248 Z"
				fill="url(#gardenGround)"
			/>
			<path
				d="M0 198 C76 186 162 188 244 202 S406 220 520 194 L520 248 L0 248 Z"
				fill="url(#gardenFrontGround)"
			/>

			{#if growthLevel >= 1}
				<g class="layer grass-back">
					<path d="M42 197 C48 182 50 174 54 197" />
					<path d="M66 193 C72 176 76 168 80 193" />
					<path d="M92 200 C98 182 101 173 106 200" />
					<path d="M130 194 C135 176 140 168 145 194" />
					<path d="M164 198 C170 180 174 172 178 198" />
					<path d="M212 202 C217 184 222 176 226 202" />
					<path d="M286 198 C291 180 295 172 299 198" />
					<path d="M328 202 C332 184 337 176 341 202" />
					<path d="M372 196 C377 178 381 170 386 196" />
					<path d="M406 201 C410 184 415 176 419 201" />
					<path d="M444 196 C449 178 453 170 458 196" />
					<path d="M476 200 C481 183 485 174 490 200" />
				</g>
				<g class="layer grass-front">
					<path d="M52 214 C60 190 64 180 70 214" />
					<path d="M84 218 C91 194 96 184 102 218" />
					<path d="M118 212 C125 188 130 178 136 212" />
					<path d="M154 220 C161 194 168 184 172 220" />
					<path d="M202 216 C208 194 214 184 220 216" />
					<path d="M246 220 C252 198 257 188 262 220" />
					<path d="M304 216 C310 194 316 184 320 216" />
					<path d="M352 220 C358 198 364 188 370 220" />
					<path d="M396 214 C404 190 409 180 414 214" />
					<path d="M432 220 C439 196 444 186 450 220" />
					<path d="M468 214 C474 190 478 180 484 214" />
				</g>
			{/if}

			{#if growthLevel >= 2}
				<g class="layer flowers">
					<g transform="translate(160 200)">
						<path d="M0 0 C0 -10 0 -19 1 -26" class="stem" />
						<ellipse cx="-4.5" cy="-28" rx="4.3" ry="3.2" class="petal-soft" />
						<ellipse cx="4.5" cy="-28" rx="4.3" ry="3.2" class="petal-soft" />
						<ellipse cx="0" cy="-33" rx="3.6" ry="4.2" class="petal-soft" />
						<ellipse cx="0" cy="-23" rx="3.6" ry="4.2" class="petal-soft" />
						<circle cx="0" cy="-28" r="2.8" class="flower-core" />
					</g>
					<g transform="translate(230 208)">
						<path d="M0 0 C0 -8 0 -16 0 -22" class="stem" />
						<ellipse cx="-4" cy="-24" rx="3.8" ry="2.9" class="petal-muted" />
						<ellipse cx="4" cy="-24" rx="3.8" ry="2.9" class="petal-muted" />
						<ellipse cx="0" cy="-28.5" rx="3.1" ry="3.8" class="petal-muted" />
						<ellipse cx="0" cy="-19.5" rx="3.1" ry="3.8" class="petal-muted" />
						<circle cx="0" cy="-24" r="2.4" class="flower-core" />
					</g>
					<g transform="translate(338 198)">
						<path d="M0 0 C0 -9 0 -18 1 -25" class="stem" />
						<ellipse cx="-4.5" cy="-27" rx="4.1" ry="3" class="petal-soft" />
						<ellipse cx="4.5" cy="-27" rx="4.1" ry="3" class="petal-soft" />
						<ellipse cx="0" cy="-31.5" rx="3.3" ry="3.9" class="petal-soft" />
						<ellipse cx="0" cy="-22.5" rx="3.3" ry="3.9" class="petal-soft" />
						<circle cx="0" cy="-27" r="2.6" class="flower-core" />
					</g>
				</g>
			{/if}

			{#if growthLevel >= 3}
				<g class="layer bush">
					<path
						d="M94 206 C98 186 114 176 130 180 C132 164 146 154 162 158 C170 144 188 142 201 150 C218 148 230 162 230 178 C246 180 256 192 256 206 Z"
						fill="url(#gardenBush)"
					/>
					<path
						d="M100 206 C106 194 118 188 130 190 C138 180 150 176 162 178 C172 168 186 168 196 174 C208 172 220 180 224 192 C236 194 244 198 248 206 Z"
						class="bush-shadow"
					/>
					<path
						d="M110 206 C114 196 122 190 130 192 C136 186 144 182 154 184 C160 176 170 174 180 178 C190 176 202 180 208 188 C218 188 228 194 232 206 Z"
						class="bush-highlight"
					/>
				</g>
			{/if}

			{#if growthLevel >= 4}
				<g class="layer tree">
					<path
						d="M356 206 C356 182 358 164 362 150 C366 136 370 122 374 108 C378 96 386 88 392 88 C398 88 404 94 406 104 C409 116 412 132 415 146 C418 164 420 184 420 206 Z"
						fill="url(#gardenTrunk)"
					/>
					<path
						d="M388 90 C372 92 360 100 354 114 C338 116 326 128 324 142 C314 148 308 160 310 172 C314 190 332 198 354 198 H422 C442 198 458 188 462 172 C466 158 460 146 450 138 C448 122 436 108 418 102 C410 92 400 88 388 90 Z"
						fill="url(#gardenTreeFoliage)"
					/>
					<path
						d="M390 102 C376 104 366 112 360 122 C348 124 338 132 336 144 C328 150 324 160 326 168 C330 184 344 190 362 190 H414 C432 190 446 182 448 168 C450 158 446 150 438 144 C436 132 426 122 412 116 C406 108 398 102 390 102 Z"
						class="tree-inner"
					/>
					<path
						d="M374 140 C382 136 392 138 398 144"
						class="branch"
					/>
					<path
						d="M384 126 C392 122 402 124 408 132"
						class="branch"
					/>
				</g>
			{/if}
		</svg>
	</div>

	<div class="garden-meta">
		<p class="garden-note">Formad av det du skrivit och de gånger du kommit tillbaka.</p>
		<p class="garden-stats">{entryCount} inlägg och {activeDays} aktiva dagar totalt.</p>
	</div>
</section>

<style>
	.garden-card {
		--garden-sky-top: color-mix(in srgb, hsl(var(--surface)) 64%, #f2f5f1 36%);
		--garden-sky-mid: color-mix(in srgb, hsl(var(--surface-soft)) 82%, #eef1ec 18%);
		--garden-sky-bottom: color-mix(in srgb, hsl(var(--surface-soft)) 90%, #dde6df 10%);
		--garden-glow-start: rgba(240, 238, 228, 0.42);
		--garden-glow-end: rgba(240, 238, 228, 0);
		--garden-back-ground-top: color-mix(in srgb, var(--theme-accent, #0f766e) 12%, #8fa099 88%);
		--garden-back-ground-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 18%, #6e8079 82%);
		--garden-ground-top: color-mix(in srgb, var(--theme-accent, #0f766e) 26%, #657970 74%);
		--garden-ground-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 38%, #4f625a 62%);
		--garden-front-ground-top: color-mix(in srgb, var(--theme-accent, #0f766e) 34%, #53665c 66%);
		--garden-front-ground-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 48%, #3e5048 52%);
		--garden-bush-top: color-mix(in srgb, var(--theme-accent, #0f766e) 42%, #7f957f 58%);
		--garden-bush-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 56%, #536a58 44%);
		--garden-leaf-top: color-mix(in srgb, var(--theme-accent, #0f766e) 38%, #91a47c 62%);
		--garden-leaf-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 60%, #50634d 40%);
		--garden-trunk-top: color-mix(in srgb, #7d6857 76%, #5f4d40 24%);
		--garden-trunk-bottom: color-mix(in srgb, #5c493b 82%, #3d3028 18%);
		padding: 2rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%),
			hsl(var(--surface));
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
		position: relative;
		width: 100%;
		min-height: 248px;
		border-radius: 1.2rem;
		overflow: hidden;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 46%),
			color-mix(in srgb, hsl(var(--surface-soft)) 90%, white 10%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			inset 0 -22px 40px rgba(28, 40, 36, 0.06);
	}

	.garden-scene svg {
		display: block;
		width: 100%;
		height: auto;
		min-height: 248px;
	}

	.glow {
		opacity: 0.88;
	}

	.horizon {
		fill: rgba(255, 255, 255, 0.08);
	}

	.mist {
		fill: rgba(255, 255, 255, 0.26);
	}

	.mist-left {
		opacity: 0.68;
	}

	.mist-right {
		opacity: 0.46;
	}

	.layer {
		animation: gardenFade 360ms ease-out both;
	}

	.grass-back path {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #0f766e) 34%, #728975 66%);
		stroke-width: 2.2;
		stroke-linecap: round;
		opacity: 0.78;
	}

	.grass-front path {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #0f766e) 46%, #607862 54%);
		stroke-width: 2.8;
		stroke-linecap: round;
	}

	.stem {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #0f766e) 40%, #74846d 60%);
		stroke-width: 1.8;
		stroke-linecap: round;
	}

	.flower-core {
		fill: color-mix(in srgb, #efe0bc 84%, white 16%);
	}

	.petal-soft {
		fill: color-mix(in srgb, #ded7cf 82%, white 18%);
	}

	.petal-muted {
		fill: color-mix(in srgb, #d9d8e1 80%, white 20%);
	}

	.bush-shadow {
		fill: rgba(45, 60, 49, 0.22);
	}

	.bush-highlight {
		fill: rgba(196, 214, 196, 0.18);
	}

	.tree-inner {
		fill: rgba(210, 224, 197, 0.18);
	}

	.branch {
		fill: none;
		stroke: rgba(84, 68, 57, 0.4);
		stroke-width: 2;
		stroke-linecap: round;
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
		--garden-sky-top: color-mix(in srgb, hsl(var(--surface)) 84%, #16212a 16%);
		--garden-sky-mid: color-mix(in srgb, hsl(var(--surface-soft)) 82%, #13202a 18%);
		--garden-sky-bottom: color-mix(in srgb, hsl(var(--surface-soft)) 88%, #101a22 12%);
		--garden-glow-start: rgba(174, 182, 166, 0.12);
		--garden-glow-end: rgba(174, 182, 166, 0);
		--garden-back-ground-top: color-mix(in srgb, var(--theme-accent, #0f766e) 16%, #33423f 84%);
		--garden-back-ground-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 22%, #273632 78%);
		--garden-ground-top: color-mix(in srgb, var(--theme-accent, #0f766e) 26%, #2d4038 74%);
		--garden-ground-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 36%, #21312d 64%);
		--garden-front-ground-top: color-mix(in srgb, var(--theme-accent, #0f766e) 34%, #22322d 66%);
		--garden-front-ground-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 44%, #17251f 56%);
		--garden-bush-top: color-mix(in srgb, var(--theme-accent, #0f766e) 34%, #5d745f 66%);
		--garden-bush-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 50%, #374c3d 50%);
		--garden-leaf-top: color-mix(in srgb, var(--theme-accent, #0f766e) 32%, #7c8c6d 68%);
		--garden-leaf-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 56%, #405240 44%);
		--garden-trunk-top: color-mix(in srgb, #715d4d 70%, #4a3d33 30%);
		--garden-trunk-bottom: color-mix(in srgb, #4a3b31 78%, #302620 22%);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0) 100%),
			hsl(var(--surface));
		box-shadow:
			0 2px 10px rgba(0, 0, 0, 0.16),
			inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	:global(.dark) .garden-scene {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 42%),
			color-mix(in srgb, hsl(var(--surface-soft)) 90%, #0f1720 10%);
		border-color: rgba(255, 255, 255, 0.04);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.02),
			inset 0 -28px 44px rgba(4, 9, 12, 0.32);
	}

	:global(.dark) .horizon {
		fill: rgba(223, 231, 220, 0.04);
	}

	:global(.dark) .mist {
		fill: rgba(224, 232, 235, 0.08);
	}

	:global(.dark) .bush-shadow {
		fill: rgba(10, 16, 13, 0.28);
	}

	:global(.dark) .bush-highlight,
	:global(.dark) .tree-inner {
		fill: rgba(203, 216, 195, 0.1);
	}

	:global(.dark) .branch {
		stroke: rgba(21, 17, 14, 0.42);
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
			min-height: 206px;
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
