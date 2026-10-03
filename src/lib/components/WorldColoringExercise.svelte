<script lang="ts">
	type PartId =
		| 'petalTop'
		| 'petalRight'
		| 'petalBottomRight'
		| 'petalBottomLeft'
		| 'petalLeft'
		| 'center'
		| 'leafLeft'
		| 'leafRight';

	const blankColor = '#fffaf2';
	const palette = [
		{ name: 'Dimmig blå', value: '#8db7c7' },
		{ name: 'Salviagrön', value: '#91ad86' },
		{ name: 'Mjuk gul', value: '#e9c979' },
		{ name: 'Ljus terrakotta', value: '#d99a7c' },
		{ name: 'Lugn lila', value: '#aa9bc2' }
	] as const;

	const initialFills: Record<PartId, string> = {
		petalTop: blankColor,
		petalRight: blankColor,
		petalBottomRight: blankColor,
		petalBottomLeft: blankColor,
		petalLeft: blankColor,
		center: blankColor,
		leafLeft: blankColor,
		leafRight: blankColor
	};

	let selectedColor = $state<string>(palette[0].value);
	let fills = $state<Record<PartId, string>>({ ...initialFills });
	let status = $state(`Vald färg: ${palette[0].name}.`);

	function getColorName(value: string) {
		return palette.find((color) => color.value === value)?.name ?? 'inte färglagd';
	}

	function selectColor(name: string, value: string) {
		selectedColor = value;
		status = `Vald färg: ${name}.`;
	}

	function paintPart(part: PartId, label: string) {
		fills[part] = selectedColor;
		status = `${label} har fått färgen ${getColorName(selectedColor).toLowerCase()}.`;
	}

	function handlePartKeydown(event: KeyboardEvent, part: PartId, label: string) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		paintPart(part, label);
	}

	function partLabel(part: PartId, label: string) {
		return `${label}, ${getColorName(fills[part]).toLowerCase()}. Tryck för att färglägga.`;
	}

	function resetDrawing() {
		fills = { ...initialFills };
		status = 'Motivet är återställt. Du kan börja om när du vill.';
	}
</script>

<div class="coloring-exercise">
	<div class="exercise-intro">
		<h2>Välj en färg och börja där du vill</h2>
		<p>Du behöver inte göra det fint, färdigt eller perfekt. Låt färgerna få ta plats i sin egen takt.</p>
	</div>

	<div class="palette" aria-label="Välj färg">
		{#each palette as color}
			<button
				type="button"
				class="color-button"
				class:selected={selectedColor === color.value}
				style={`--swatch: ${color.value}`}
				aria-pressed={selectedColor === color.value}
				onclick={() => selectColor(color.name, color.value)}
			>
				<span class="swatch" aria-hidden="true"></span>
				<span>{color.name}</span>
			</button>
		{/each}
	</div>

	<p class="status" aria-live="polite">{status}</p>

	<div class="canvas">
		<svg viewBox="0 0 320 300" role="group" aria-labelledby="coloring-title coloring-description">
			<title id="coloring-title">En blomma att färglägga</title>
			<desc id="coloring-description">Välj en färg och använd blomdelarna som knappar. Du kan också nå dem med tabbtangenten.</desc>

			<circle class="sky" cx="160" cy="145" r="126" />
			<path class="hill hill-back" d="M34 212C78 174 118 188 158 206C207 228 249 179 286 201V270H34Z" />
			<path class="hill hill-front" d="M34 238C83 206 128 223 169 239C215 257 253 219 286 225V270H34Z" />
			<path class="stem" d="M160 137C158 175 159 214 166 251" />

			<ellipse
				class="paintable"
				cx="160"
				cy="83"
				rx="29"
				ry="48"
				fill={fills.petalTop}
				role="button"
				tabindex="0"
				aria-label={partLabel('petalTop', 'Övre kronbladet')}
				onclick={() => paintPart('petalTop', 'Övre kronbladet')}
				onkeydown={(event) => handlePartKeydown(event, 'petalTop', 'Övre kronbladet')}
			/>
			<ellipse
				class="paintable"
				cx="210"
				cy="126"
				rx="29"
				ry="48"
				transform="rotate(72 210 126)"
				fill={fills.petalRight}
				role="button"
				tabindex="0"
				aria-label={partLabel('petalRight', 'Högra kronbladet')}
				onclick={() => paintPart('petalRight', 'Högra kronbladet')}
				onkeydown={(event) => handlePartKeydown(event, 'petalRight', 'Högra kronbladet')}
			/>
			<ellipse
				class="paintable"
				cx="190"
				cy="184"
				rx="29"
				ry="48"
				transform="rotate(144 190 184)"
				fill={fills.petalBottomRight}
				role="button"
				tabindex="0"
				aria-label={partLabel('petalBottomRight', 'Nedre högra kronbladet')}
				onclick={() => paintPart('petalBottomRight', 'Nedre högra kronbladet')}
				onkeydown={(event) => handlePartKeydown(event, 'petalBottomRight', 'Nedre högra kronbladet')}
			/>
			<ellipse
				class="paintable"
				cx="130"
				cy="184"
				rx="29"
				ry="48"
				transform="rotate(-144 130 184)"
				fill={fills.petalBottomLeft}
				role="button"
				tabindex="0"
				aria-label={partLabel('petalBottomLeft', 'Nedre vänstra kronbladet')}
				onclick={() => paintPart('petalBottomLeft', 'Nedre vänstra kronbladet')}
				onkeydown={(event) => handlePartKeydown(event, 'petalBottomLeft', 'Nedre vänstra kronbladet')}
			/>
			<ellipse
				class="paintable"
				cx="110"
				cy="126"
				rx="29"
				ry="48"
				transform="rotate(-72 110 126)"
				fill={fills.petalLeft}
				role="button"
				tabindex="0"
				aria-label={partLabel('petalLeft', 'Vänstra kronbladet')}
				onclick={() => paintPart('petalLeft', 'Vänstra kronbladet')}
				onkeydown={(event) => handlePartKeydown(event, 'petalLeft', 'Vänstra kronbladet')}
			/>
			<circle
				class="paintable"
				cx="160"
				cy="143"
				r="33"
				fill={fills.center}
				role="button"
				tabindex="0"
				aria-label={partLabel('center', 'Blommans mitt')}
				onclick={() => paintPart('center', 'Blommans mitt')}
				onkeydown={(event) => handlePartKeydown(event, 'center', 'Blommans mitt')}
			/>
			<path
				class="paintable"
				d="M158 205C124 182 93 197 89 230C119 236 145 226 158 205Z"
				fill={fills.leafLeft}
				role="button"
				tabindex="0"
				aria-label={partLabel('leafLeft', 'Vänstra bladet')}
				onclick={() => paintPart('leafLeft', 'Vänstra bladet')}
				onkeydown={(event) => handlePartKeydown(event, 'leafLeft', 'Vänstra bladet')}
			/>
			<path
				class="paintable"
				d="M163 220C190 193 224 200 235 231C207 243 181 237 163 220Z"
				fill={fills.leafRight}
				role="button"
				tabindex="0"
				aria-label={partLabel('leafRight', 'Högra bladet')}
				onclick={() => paintPart('leafRight', 'Högra bladet')}
				onkeydown={(event) => handlePartKeydown(event, 'leafRight', 'Högra bladet')}
			/>
		</svg>
	</div>

	<div class="actions">
		<button type="button" class="reset-button" onclick={resetDrawing}>Återställ</button>
	</div>
</div>

<style>
	.coloring-exercise {
		padding: 1rem;
		background: linear-gradient(180deg, #fbfcf8 0%, #f5f8f2 100%);
	}

	.exercise-intro h2 {
		margin: 0;
		font-size: 1.16rem;
		line-height: 1.35;
	}

	.exercise-intro p {
		margin: 0.65rem 0 0;
		max-width: 62ch;
		line-height: 1.65;
		color: #47554b;
	}

	.palette {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
		gap: 0.55rem;
		margin-top: 1rem;
	}

	.color-button {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		min-height: 2.75rem;
		padding: 0.5rem 0.65rem;
		border: 1px solid rgba(57, 83, 65, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.82);
		color: #28382e;
		font: inherit;
		font-size: 0.88rem;
		text-align: left;
		cursor: pointer;
		transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
	}

	.color-button:hover {
		border-color: rgba(57, 83, 65, 0.42);
		background: #ffffff;
	}

	.color-button.selected {
		border-color: #3e654b;
		box-shadow: 0 0 0 2px rgba(62, 101, 75, 0.16);
	}

	.color-button:focus-visible,
	.reset-button:focus-visible {
		outline: 3px solid rgba(37, 99, 235, 0.35);
		outline-offset: 2px;
	}

	.swatch {
		flex: 0 0 auto;
		width: 1.65rem;
		height: 1.65rem;
		border: 1px solid rgba(40, 56, 46, 0.24);
		border-radius: 999px;
		background: var(--swatch);
	}

	.status {
		min-height: 1.5rem;
		margin: 0.8rem 0 0;
		font-size: 0.88rem;
		color: #526158;
	}

	.canvas {
		max-width: 31rem;
		margin: 0.75rem auto 0;
		padding: clamp(0.35rem, 2vw, 0.8rem);
		border: 1px solid rgba(57, 83, 65, 0.14);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.7);
	}

	.canvas svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.sky {
		fill: #edf3ed;
	}

	.hill {
		pointer-events: none;
	}

	.hill-back {
		fill: #d7e3d2;
	}

	.hill-front {
		fill: #b9cfb2;
	}

	.stem {
		fill: none;
		stroke: #607d62;
		stroke-width: 8;
		stroke-linecap: round;
	}

	.paintable {
		stroke: #526958;
		stroke-width: 2.5;
		stroke-linejoin: round;
		cursor: pointer;
		touch-action: manipulation;
		transition: fill 180ms ease, stroke-width 120ms ease, filter 120ms ease;
	}

	.paintable:hover {
		filter: brightness(0.97);
		stroke-width: 3.5;
	}

	.paintable:focus-visible {
		outline: none;
		stroke: #1d4ed8;
		stroke-width: 5;
	}

	.actions {
		display: flex;
		justify-content: center;
		margin-top: 0.85rem;
	}

	.reset-button {
		min-height: 2.75rem;
		padding: 0.55rem 1rem;
		border: 1px solid rgba(57, 83, 65, 0.28);
		border-radius: 999px;
		background: #ffffff;
		color: #314638;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.reset-button:hover {
		background: #f3f6f1;
	}

	:global(.dark) .coloring-exercise {
		background: linear-gradient(180deg, #111827 0%, #152019 100%);
	}

	:global(.dark) .exercise-intro p,
	:global(.dark) .status {
		color: #c3d0c6;
	}

	:global(.dark) .color-button,
	:global(.dark) .reset-button {
		border-color: rgba(196, 219, 201, 0.24);
		background: #1d2921;
		color: #edf5ef;
	}

	:global(.dark) .color-button:hover,
	:global(.dark) .reset-button:hover {
		background: #25332a;
	}

	:global(.dark) .color-button.selected {
		border-color: #a9cbb0;
		box-shadow: 0 0 0 2px rgba(169, 203, 176, 0.2);
	}

	:global(.dark) .canvas {
		border-color: rgba(196, 219, 201, 0.18);
		background: rgba(17, 24, 39, 0.7);
	}

	@media (max-width: 480px) {
		.coloring-exercise {
			padding: 0.95rem 0.85rem;
		}

		.palette {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.color-button {
			padding: 0.45rem 0.5rem;
			font-size: 0.82rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.color-button,
		.paintable {
			transition: none;
		}
	}
</style>
