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
				<linearGradient id="gardenBlossom" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-blossom-top)" />
					<stop offset="100%" stop-color="var(--garden-blossom-bottom)" />
				</linearGradient>
				<linearGradient id="gardenBlossomSoft" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-blossom-soft-top)" />
					<stop offset="100%" stop-color="var(--garden-blossom-soft-bottom)" />
				</linearGradient>
				<linearGradient id="gardenEggShell" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-egg-top)" />
					<stop offset="100%" stop-color="var(--garden-egg-bottom)" />
				</linearGradient>
				<linearGradient id="gardenEggShade" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-egg-shade-top)" />
					<stop offset="100%" stop-color="var(--garden-egg-shade-bottom)" />
				</linearGradient>
				<linearGradient id="gardenDinoBody" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-dino-top)" />
					<stop offset="100%" stop-color="var(--garden-dino-bottom)" />
				</linearGradient>
				<linearGradient id="gardenDinoBelly" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-dino-belly-top)" />
					<stop offset="100%" stop-color="var(--garden-dino-belly-bottom)" />
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

			{#if growthLevel === 0}
				<g class="layer egg-stage">
					<ellipse cx="260" cy="214" rx="54" ry="12" class="egg-shadow" />
					<path
						d="M260 68 C226 68 206 106 206 150 C206 184 228 206 260 206 C292 206 314 184 314 150 C314 106 294 68 260 68 Z"
						class="egg-shell"
					/>
					<path
						d="M261 76 C236 84 224 114 224 152 C224 176 238 194 258 200 C248 183 244 162 244 134 C244 112 250 91 261 76 Z"
						class="egg-shell-shade"
					/>
					<circle cx="236" cy="124" r="4.2" class="egg-speck" />
					<circle cx="280" cy="142" r="3.4" class="egg-speck" />
					<circle cx="254" cy="168" r="3.8" class="egg-speck" />
					<path d="M246 140 L254 150 L246 160 L259 170 L252 183" class="crack-line" />
					<path d="M270 132 L276 141 L270 150" class="crack-line crack-line-soft" />
					<path d="M284 154 L290 164 L284 173" class="crack-line crack-line-soft" />
				</g>
			{/if}

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

			{#if growthLevel === 1}
				<g class="layer dino-stage">
					<ellipse cx="260" cy="214" rx="56" ry="12" class="egg-shadow" />
					<path
						d="M214 160 L228 144 L246 154 L260 136 L278 152 L298 144 L308 160 L308 206 L214 206 Z"
						class="egg-shell"
					/>
					<path
						d="M228 146 L240 120 L258 132 L272 110 L292 122 L300 148 L228 146 Z"
						class="egg-shell-piece"
					/>
					<path d="M268 156 C273 146 281 138 292 132" class="dino-neck neck-small" />
					<ellipse cx="302" cy="128" rx="16" ry="13" class="dino-head" />
					<circle cx="307" cy="124" r="2.2" class="dino-eye" />
					<circle cx="296" cy="131" r="3.8" class="dino-cheek" />
					<path d="M298 134 C301 137 306 137 309 134" class="dino-smile" />
					<path d="M314 128 C318 124 320 122 323 120" class="dino-crest" />
					<path d="M230 166 L238 175 L230 184" class="crack-line crack-line-soft" />
					<path d="M292 166 L300 175 L292 184" class="crack-line crack-line-soft" />
				</g>
			{/if}

			{#if growthLevel === 2}
				<g class="layer dino-stage">
					<ellipse cx="260" cy="214" rx="62" ry="12" class="dino-shadow" />
					<path d="M212 186 L224 170 L240 182 L238 206 L212 206 Z" class="egg-shell-piece" />
					<path d="M284 182 L300 168 L312 184 L308 206 L284 206 Z" class="egg-shell-piece" />
					<path d="M229 174 C215 170 205 164 198 156" class="dino-tail tail-small" />
					<ellipse cx="264" cy="174" rx="36" ry="24" class="dino-body" />
					<ellipse cx="272" cy="182" rx="20" ry="12" class="dino-belly" />
					<path d="M289 156 C296 144 304 136 314 129" class="dino-neck neck-small" />
					<ellipse cx="324" cy="124" rx="14" ry="11" class="dino-head" />
					<path d="M248 188 L246 206" class="dino-leg leg-small" />
					<path d="M276 188 L278 206" class="dino-leg leg-small" />
					<path d="M288 169 C296 171 301 175 304 181" class="dino-arm arm-small" />
					<circle cx="252" cy="166" r="4" class="dino-spot" />
					<circle cx="274" cy="160" r="3.4" class="dino-spot" />
					<circle cx="291" cy="171" r="3.2" class="dino-spot" />
					<circle cx="329" cy="120" r="2" class="dino-eye" />
					<circle cx="319" cy="127" r="3.4" class="dino-cheek" />
					<path d="M319 130 C322 132 326 132 328 130" class="dino-smile" />
				</g>
			{/if}

			{#if growthLevel === 3}
				<g class="layer dino-stage">
					<path
						d="M168 206 C184 194 204 190 226 192 C238 182 254 178 270 180 C284 174 300 176 314 184 C332 184 348 192 356 206 Z"
						class="level-three-meadow"
					/>
					<ellipse cx="264" cy="216" rx="76" ry="13" class="dino-shadow" />
					<path d="M214 172 C194 166 179 157 166 144" class="dino-tail tail-medium" />
					<ellipse cx="266" cy="170" rx="52" ry="34" class="dino-body" />
					<ellipse cx="276" cy="182" rx="28" ry="16" class="dino-belly" />
					<path d="M306 152 C318 130 331 112 347 100" class="dino-neck neck-medium" />
					<ellipse cx="358" cy="94" rx="17" ry="13" class="dino-head" />
					<path d="M240 190 L238 206" class="dino-leg leg-medium" />
					<path d="M268 192 L268 206" class="dino-leg leg-medium" />
					<path d="M293 190 L294 206" class="dino-leg leg-medium" />
					<path d="M320 186 L322 206" class="dino-leg leg-medium" />
					<path d="M309 168 C317 171 323 176 327 183" class="dino-arm arm-medium" />
					<circle cx="244" cy="162" r="5.2" class="dino-spot" />
					<circle cx="272" cy="155" r="4.6" class="dino-spot" />
					<circle cx="294" cy="165" r="4.4" class="dino-spot" />
					<circle cx="316" cy="174" r="4.2" class="dino-spot" />
					<path d="M346 198 L360 186 L370 198 L366 206 L346 206 Z" class="egg-shell-piece shell-fragment" />
					<circle cx="363" cy="90" r="2.2" class="dino-eye" />
					<circle cx="352" cy="98" r="3.8" class="dino-cheek" />
					<path d="M352 101 C355 104 360 104 363 101" class="dino-smile" />
					<path d="M369 93 C372 91 374 90 377 90" class="dino-crest" />
				</g>
			{/if}

			{#if entryCount >= 100}
				<!-- Mysterie-ägg: visas när användaren nått 100 inlägg, oavsett growthLevel -->
				<g class="mystery-egg-stage">
					<ellipse cx="78" cy="169" rx="30" ry="34" class="mystery-egg-glow" />
					<ellipse cx="78" cy="188" rx="19" ry="5" class="egg-shadow" />
					<path
						d="M78 150 C69 150 62 164 62 174 C62 184 69 188 78 188 C87 188 94 184 94 174 C94 164 87 150 78 150 Z"
						class="egg-shell"
					/>
					<path
						d="M79 153 C73 157 68 166 68 174 C68 181 71 185 75 187 C71 181 69 174 69 168 C69 162 73 156 79 153 Z"
						class="egg-shell-shade"
					/>
					<circle cx="70" cy="161" r="2.1" class="egg-speck" />
					<circle cx="84" cy="170" r="1.8" class="egg-speck" />
					<circle cx="73" cy="177" r="1.6" class="egg-speck" />
				</g>
			{/if}

			{#if growthLevel >= 4}
				<g class="layer dino-stage level-four">
					<path
						d="M270 206 C286 194 304 190 324 192 C336 182 352 178 368 180 C382 170 398 170 414 176 C430 172 446 178 456 188 C474 188 490 194 498 206 Z"
						class="level-four-meadow"
					/>
					<g class="level-four-grass">
						<path d="M286 214 C294 192 300 182 306 214" />
						<path d="M320 218 C326 196 332 186 338 218" />
						<path d="M416 216 C422 194 428 184 434 216" />
						<path d="M470 214 C476 194 480 184 486 214" />
					</g>
					<ellipse cx="300" cy="218" rx="100" ry="14" class="dino-shadow" />
					<path d="M228 168 C198 164 174 154 154 136" class="dino-tail tail-large" />
					<ellipse cx="294" cy="166" rx="74" ry="44" class="dino-body" />
					<ellipse cx="306" cy="178" rx="40" ry="20" class="dino-belly" />
					<path d="M340 146 C356 114 375 88 398 74" class="dino-neck neck-large" />
					<ellipse cx="418" cy="68" rx="22" ry="17" class="dino-head" />
					<path d="M266 190 L264 206" class="dino-leg leg-large" />
					<path d="M292 192 L292 206" class="dino-leg leg-large" />
					<path d="M322 190 L324 206" class="dino-leg leg-large" />
					<path d="M346 188 L348 206" class="dino-leg leg-large" />
					<path d="M338 168 C347 170 354 176 359 184" class="dino-arm arm-large" />
					<path d="M410 70 C414 65 419 63 424 62" class="dino-crest" />
					<circle cx="250" cy="154" r="6.2" class="dino-spot" />
					<circle cx="282" cy="146" r="5.8" class="dino-spot" />
					<circle cx="314" cy="154" r="5.4" class="dino-spot" />
					<circle cx="340" cy="168" r="5.1" class="dino-spot" />
					<circle cx="361" cy="181" r="4.6" class="dino-spot" />
					<circle cx="425" cy="63" r="2.6" class="dino-eye" />
					<circle cx="411" cy="74" r="4.6" class="dino-cheek" />
					<path d="M410 78 C414 82 421 82 425 78" class="dino-smile" />
					<path d="M433 68 C436 66 438 66 441 66" class="dino-nostril" />
				</g>
			{/if}
		</svg>
	</div>

	<div class="garden-meta">
		<p class="garden-note">Formad av det du skrivit och de gånger du kommit tillbaka.</p>
		<p class="garden-stats">{entryCount} inlägg och {activeDays} aktiva dagar totalt.</p>
	</div>

	{#if entryCount >= 100}
		<p class="mystery-hint">Något nytt håller på att hända...</p>
	{/if}
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
		--garden-blossom-top: color-mix(in srgb, #f8e8ef 78%, #f1bfd4 22%);
		--garden-blossom-bottom: color-mix(in srgb, #efc4d9 74%, #f7f2f4 26%);
		--garden-blossom-soft-top: color-mix(in srgb, #fff8fb 70%, #f6d9e5 30%);
		--garden-blossom-soft-bottom: color-mix(in srgb, #f3d5df 76%, #ffffff 24%);
		--garden-egg-top: color-mix(in srgb, #f7f0e4 84%, #efe3cd 16%);
		--garden-egg-bottom: color-mix(in srgb, #e9dbc0 78%, #f7f1e7 22%);
		--garden-egg-shade-top: rgba(233, 218, 191, 0.68);
		--garden-egg-shade-bottom: rgba(217, 198, 162, 0.12);
		--garden-egg-speck: rgba(188, 164, 127, 0.72);
		--garden-dino-top: color-mix(in srgb, var(--theme-accent, #0f766e) 16%, #c6d6ab 84%);
		--garden-dino-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 34%, #7e976d 66%);
		--garden-dino-belly-top: color-mix(in srgb, #f8f0db 84%, #e9dcbb 16%);
		--garden-dino-belly-bottom: color-mix(in srgb, #e8d8b2 76%, #f7efe0 24%);
		--garden-dino-spot: color-mix(in srgb, var(--theme-accent, #0f766e) 34%, #70835f 66%);
		--garden-dino-line: color-mix(in srgb, var(--garden-dino-bottom) 74%, #58664f 26%);
		--garden-dino-eye: #243328;
		--garden-dino-cheek: rgba(244, 198, 186, 0.72);
		--garden-ground-shadow: rgba(44, 60, 51, 0.14);
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

	.level-four-meadow {
		fill: rgba(178, 196, 168, 0.16);
	}

	.level-three-meadow {
		fill: rgba(178, 196, 168, 0.14);
	}

	.egg-stage,
	.dino-stage {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: gardenBloom 520ms ease-out both;
	}

	.egg-shadow,
	.dino-shadow {
		fill: var(--garden-ground-shadow);
	}

	.egg-shell,
	.egg-shell-piece {
		fill: url(#gardenEggShell);
	}

	.egg-shell-shade {
		fill: url(#gardenEggShade);
	}

	.egg-speck {
		fill: var(--garden-egg-speck);
	}

	.crack-line {
		fill: none;
		stroke: rgba(141, 120, 88, 0.72);
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.crack-line-soft {
		opacity: 0.72;
		stroke-width: 2.2;
	}

	.dino-body,
	.dino-head {
		fill: url(#gardenDinoBody);
	}

	.dino-belly {
		fill: url(#gardenDinoBelly);
	}

	.dino-neck,
	.dino-tail,
	.dino-leg,
	.dino-arm,
	.dino-smile,
	.dino-crest,
	.dino-nostril {
		fill: none;
		stroke: var(--garden-dino-line);
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.neck-small,
	.tail-small {
		stroke-width: 18;
	}

	.neck-medium,
	.tail-medium {
		stroke-width: 24;
	}

	.neck-large,
	.tail-large {
		stroke-width: 30;
	}

	.leg-small {
		stroke-width: 10;
	}

	.leg-medium {
		stroke-width: 12;
	}

	.leg-large {
		stroke-width: 14;
	}

	.arm-small {
		stroke-width: 7;
	}

	.arm-medium {
		stroke-width: 8;
	}

	.arm-large {
		stroke-width: 9;
	}

	.dino-spot {
		fill: var(--garden-dino-spot);
		opacity: 0.95;
	}

	.dino-eye {
		fill: var(--garden-dino-eye);
	}

	.dino-cheek {
		fill: var(--garden-dino-cheek);
	}

	.dino-smile,
	.dino-nostril {
		stroke-width: 2.2;
	}

	.dino-crest {
		stroke-width: 3;
		opacity: 0.68;
	}

	.shell-fragment {
		opacity: 0.92;
	}

	.level-four-grass path {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #0f766e) 42%, #617a63 58%);
		stroke-width: 2.6;
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

	/* ── Mysterie-ägg (100 inlägg) ── */
	.mystery-egg-stage {
		animation: gardenFade 500ms ease-out both;
	}

	.mystery-egg-glow {
		fill: color-mix(in srgb, var(--theme-accent, #0f766e) 32%, transparent 68%);
		transform-box: fill-box;
		transform-origin: center;
		animation: mysteryPulse 2.8s ease-in-out infinite;
	}

	@keyframes mysteryPulse {
		0%, 100% {
			opacity: 0.18;
			transform: scale(0.88);
		}
		50% {
			opacity: 0.52;
			transform: scale(1.14);
		}
	}

	.mystery-hint {
		margin: 0;
		font-size: 0.82rem;
		font-style: italic;
		color: color-mix(in srgb, var(--theme-accent, #0f766e) 55%, hsl(var(--muted-foreground)) 45%);
		animation: gardenFade 600ms ease-out both;
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

	@keyframes gardenBloom {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
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
		--garden-blossom-top: color-mix(in srgb, #f3dae6 58%, #c796b1 42%);
		--garden-blossom-bottom: color-mix(in srgb, #d6a4bd 60%, #f1d9e4 40%);
		--garden-blossom-soft-top: color-mix(in srgb, #fdeff5 52%, #d7b2c5 48%);
		--garden-blossom-soft-bottom: color-mix(in srgb, #d8afc0 60%, #fff6fa 40%);
		--garden-egg-top: color-mix(in srgb, #ede6d8 70%, #cfc2a6 30%);
		--garden-egg-bottom: color-mix(in srgb, #b5aa8d 58%, #f0e8d8 42%);
		--garden-egg-shade-top: rgba(103, 92, 73, 0.42);
		--garden-egg-shade-bottom: rgba(40, 35, 28, 0.06);
		--garden-egg-speck: rgba(148, 130, 100, 0.74);
		--garden-dino-top: color-mix(in srgb, var(--theme-accent, #0f766e) 20%, #97b28e 80%);
		--garden-dino-bottom: color-mix(in srgb, var(--theme-accent, #0f766e) 40%, #547154 60%);
		--garden-dino-belly-top: color-mix(in srgb, #e6dbc0 70%, #b8ae8b 30%);
		--garden-dino-belly-bottom: color-mix(in srgb, #b9ad85 62%, #ece3cd 38%);
		--garden-dino-spot: color-mix(in srgb, var(--theme-accent, #0f766e) 30%, #45563f 70%);
		--garden-dino-line: color-mix(in srgb, var(--garden-dino-bottom) 72%, #2a372d 28%);
		--garden-dino-eye: #eaf4e8;
		--garden-dino-cheek: rgba(224, 172, 163, 0.44);
		--garden-ground-shadow: rgba(6, 10, 12, 0.26);
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

	:global(.dark) .level-four-meadow {
		fill: rgba(178, 196, 168, 0.08);
	}

	:global(.dark) .crack-line {
		stroke: rgba(164, 145, 114, 0.68);
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
