<script module lang="ts">
	export type MotifId = 'flower' | 'cabin' | 'leaf';

	export type ColoringState = {
		fills: Record<MotifId, Record<string, string>>;
		history: Record<MotifId, Array<{ part: string; previousColor: string }>>;
	};

	export const blankColor = '#fffaf2';

	const initialParts: Record<MotifId, readonly string[]> = {
		flower: [
			'petalTop',
			'petalRight',
			'petalBottomRight',
			'petalBottomLeft',
			'petalLeft',
			'center',
			'leafLeft',
			'leafRight'
		],
		cabin: ['moon', 'roof', 'wall', 'door', 'windowLeft', 'windowRight', 'pineLeft', 'pineRight'],
		leaf: [
			'upperLeft',
			'upperRight',
			'middleLeft',
			'middleRight',
			'lowerLeft',
			'lowerRight'
		]
	};

	function blankFills(motif: MotifId) {
		return Object.fromEntries(initialParts[motif].map((part) => [part, blankColor]));
	}

	export function createColoringState(): ColoringState {
		return {
			fills: {
				flower: blankFills('flower'),
				cabin: blankFills('cabin'),
				leaf: blankFills('leaf')
			},
			history: { flower: [], cabin: [], leaf: [] }
		};
	}

	export function paintColoringPart(
		state: ColoringState,
		motif: MotifId,
		part: string,
		color: string
	): ColoringState {
		const previousColor = state.fills[motif][part];
		if (previousColor === undefined || previousColor === color) return state;

		return {
			fills: {
				...state.fills,
				[motif]: { ...state.fills[motif], [part]: color }
			},
			history: {
				...state.history,
				[motif]: [...state.history[motif], { part, previousColor }]
			}
		};
	}

	export function undoColoringPart(state: ColoringState, motif: MotifId): ColoringState {
		const latest = state.history[motif].at(-1);
		if (!latest) return state;

		return {
			fills: {
				...state.fills,
				[motif]: { ...state.fills[motif], [latest.part]: latest.previousColor }
			},
			history: {
				...state.history,
				[motif]: state.history[motif].slice(0, -1)
			}
		};
	}

	export function resetColoringMotif(state: ColoringState, motif: MotifId): ColoringState {
		return {
			fills: { ...state.fills, [motif]: blankFills(motif) },
			history: { ...state.history, [motif]: [] }
		};
	}

	export function createCreativeMomentSession() {
		let hasRecorded = false;

		return {
			registerColoringChange(changed: boolean) {
				if (!changed || hasRecorded) return false;
				hasRecorded = true;
				return true;
			}
		};
	}
</script>

<script lang="ts">
	let { onCreativeMoment, onDone, showIntro = true }: {
		onCreativeMoment?: () => void | Promise<void>;
		onDone?: () => void;
		showIntro?: boolean;
	} = $props();

	const palette = [
		{ name: 'Dimmig blå', value: '#8db7c7' },
		{ name: 'Salviagrön', value: '#91ad86' },
		{ name: 'Mjuk gul', value: '#e9c979' },
		{ name: 'Ljus terrakotta', value: '#d99a7c' },
		{ name: 'Lugn lila', value: '#aa9bc2' }
	] as const;

	const motifNames: Record<MotifId, string> = {
		flower: 'Blomman',
		cabin: 'Kvällstugan',
		leaf: 'Lövet'
	};

	let selectedMotif = $state<MotifId>('flower');
	let selectedColor = $state<string>(palette[0].value);
	let coloringState = $state<ColoringState>(createColoringState());
	let status = $state(`Vald färg: ${palette[0].name}.`);
	const creativeMomentSession = createCreativeMomentSession();
	const canUndo = $derived(coloringState.history[selectedMotif].length > 0);

	function getColorName(value: string) {
		return palette.find((color) => color.value === value)?.name ?? 'inte färglagd';
	}

	function selectMotif(motif: MotifId) {
		selectedMotif = motif;
		status = `${motifNames[motif]} är valt. Vald färg: ${getColorName(selectedColor).toLowerCase()}.`;
	}

	function selectColor(name: string, value: string) {
		selectedColor = value;
		status = `Vald färg: ${name}.`;
	}

	function paintPart(part: string, label: string) {
		const nextState = paintColoringPart(coloringState, selectedMotif, part, selectedColor);
		const shouldRecord = creativeMomentSession.registerColoringChange(nextState !== coloringState);
		coloringState = nextState;
		if (shouldRecord) void onCreativeMoment?.();
		status = `${label} har fått färgen ${getColorName(selectedColor).toLowerCase()}.`;
	}

	function handlePartKeydown(event: KeyboardEvent, part: string, label: string) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		paintPart(part, label);
	}

	function partLabel(part: string, label: string) {
		return `${label}, ${getColorName(coloringState.fills[selectedMotif][part]).toLowerCase()}. Tryck för att färglägga.`;
	}

	function undoLatest() {
		if (!canUndo) return;
		coloringState = undoColoringPart(coloringState, selectedMotif);
		status = `Senaste färgläggningen i ${motifNames[selectedMotif].toLowerCase()} är ångrad.`;
	}

	function resetDrawing() {
		coloringState = resetColoringMotif(coloringState, selectedMotif);
		status = 'Motivet är återställt. Du kan börja om när du vill.';
	}
</script>

<div class="coloring-exercise">
	{#if showIntro}
		<div class="exercise-intro">
			<h2>Välj en färg och börja där du vill</h2>
			<p>Du behöver inte göra det fint, färdigt eller perfekt. Låt färgerna få ta plats i sin egen takt.</p>
		</div>
	{/if}

	<div class="motif-picker" aria-labelledby="motif-picker-label">
		<p id="motif-picker-label">Välj motiv</p>
		<div class="motif-buttons">
			{#each Object.entries(motifNames) as [motif, name]}
				<button
					type="button"
					class="motif-button"
					class:selected={selectedMotif === motif}
					aria-pressed={selectedMotif === motif}
					onclick={() => selectMotif(motif as MotifId)}
				>{name}</button>
			{/each}
		</div>
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
		{#if selectedMotif === 'flower'}
			<!-- Flower motif -->
			<svg viewBox="0 0 320 300" role="group" aria-labelledby="flower-title flower-description">
				<title id="flower-title">En blomma att färglägga</title>
				<desc id="flower-description">Välj en färg och använd blomdelarna som knappar. Du kan också nå dem med tabbtangenten.</desc>

				<circle class="sky" cx="160" cy="145" r="126" />
				<path class="hill hill-back" d="M34 212C78 174 118 188 158 206C207 228 249 179 286 201V270H34Z" />
				<path class="hill hill-front" d="M34 238C83 206 128 223 169 239C215 257 253 219 286 225V270H34Z" />
				<path class="stem" d="M160 137C158 175 159 214 166 251" />

				<ellipse class="paintable" cx="160" cy="83" rx="29" ry="48" fill={coloringState.fills.flower.petalTop} role="button" tabindex="0" aria-label={partLabel('petalTop', 'Övre kronbladet')} onclick={() => paintPart('petalTop', 'Övre kronbladet')} onkeydown={(event) => handlePartKeydown(event, 'petalTop', 'Övre kronbladet')} />
				<ellipse class="paintable" cx="210" cy="126" rx="29" ry="48" transform="rotate(72 210 126)" fill={coloringState.fills.flower.petalRight} role="button" tabindex="0" aria-label={partLabel('petalRight', 'Högra kronbladet')} onclick={() => paintPart('petalRight', 'Högra kronbladet')} onkeydown={(event) => handlePartKeydown(event, 'petalRight', 'Högra kronbladet')} />
				<ellipse class="paintable" cx="190" cy="184" rx="29" ry="48" transform="rotate(144 190 184)" fill={coloringState.fills.flower.petalBottomRight} role="button" tabindex="0" aria-label={partLabel('petalBottomRight', 'Nedre högra kronbladet')} onclick={() => paintPart('petalBottomRight', 'Nedre högra kronbladet')} onkeydown={(event) => handlePartKeydown(event, 'petalBottomRight', 'Nedre högra kronbladet')} />
				<ellipse class="paintable" cx="130" cy="184" rx="29" ry="48" transform="rotate(-144 130 184)" fill={coloringState.fills.flower.petalBottomLeft} role="button" tabindex="0" aria-label={partLabel('petalBottomLeft', 'Nedre vänstra kronbladet')} onclick={() => paintPart('petalBottomLeft', 'Nedre vänstra kronbladet')} onkeydown={(event) => handlePartKeydown(event, 'petalBottomLeft', 'Nedre vänstra kronbladet')} />
				<ellipse class="paintable" cx="110" cy="126" rx="29" ry="48" transform="rotate(-72 110 126)" fill={coloringState.fills.flower.petalLeft} role="button" tabindex="0" aria-label={partLabel('petalLeft', 'Vänstra kronbladet')} onclick={() => paintPart('petalLeft', 'Vänstra kronbladet')} onkeydown={(event) => handlePartKeydown(event, 'petalLeft', 'Vänstra kronbladet')} />
				<circle class="paintable" cx="160" cy="143" r="33" fill={coloringState.fills.flower.center} role="button" tabindex="0" aria-label={partLabel('center', 'Blommans mitt')} onclick={() => paintPart('center', 'Blommans mitt')} onkeydown={(event) => handlePartKeydown(event, 'center', 'Blommans mitt')} />
				<path class="paintable" d="M158 205C124 182 93 197 89 230C119 236 145 226 158 205Z" fill={coloringState.fills.flower.leafLeft} role="button" tabindex="0" aria-label={partLabel('leafLeft', 'Vänstra bladet')} onclick={() => paintPart('leafLeft', 'Vänstra bladet')} onkeydown={(event) => handlePartKeydown(event, 'leafLeft', 'Vänstra bladet')} />
				<path class="paintable" d="M163 220C190 193 224 200 235 231C207 243 181 237 163 220Z" fill={coloringState.fills.flower.leafRight} role="button" tabindex="0" aria-label={partLabel('leafRight', 'Högra bladet')} onclick={() => paintPart('leafRight', 'Högra bladet')} onkeydown={(event) => handlePartKeydown(event, 'leafRight', 'Högra bladet')} />
			</svg>
		{:else if selectedMotif === 'cabin'}
			<!-- Cabin motif -->
			<svg viewBox="0 0 360 280" role="group" aria-labelledby="cabin-title cabin-description">
				<title id="cabin-title">Kvällstugan och månen att färglägga</title>
				<desc id="cabin-description">Välj en färg och använd stugans och naturens delar som knappar. Du kan också nå dem med tabbtangenten.</desc>

				<rect class="evening-sky" x="16" y="14" width="328" height="248" rx="28" />
				<circle class="star" cx="79" cy="55" r="2.5" />
				<circle class="star" cx="108" cy="35" r="1.8" />
				<circle class="star" cx="302" cy="75" r="2.2" />
				<path class="hill hill-back" d="M16 164C62 127 102 135 140 157C185 183 228 120 276 151C302 168 326 151 344 141V262H16Z" />
				<path class="hill hill-front" d="M16 197C62 168 105 178 145 199C192 224 241 177 284 194C308 204 327 191 344 185V262H16Z" />
				<path class="lake-line" d="M18 220C92 212 145 226 210 219C258 214 300 222 342 216" />

				<circle class="paintable" cx="276" cy="69" r="28" fill={coloringState.fills.cabin.moon} role="button" tabindex="0" aria-label={partLabel('moon', 'Månen')} onclick={() => paintPart('moon', 'Månen')} onkeydown={(event) => handlePartKeydown(event, 'moon', 'Månen')} />
				<path class="paintable" d="M113 146L181 93L249 146L235 158H126Z" fill={coloringState.fills.cabin.roof} role="button" tabindex="0" aria-label={partLabel('roof', 'Stugans tak')} onclick={() => paintPart('roof', 'Stugans tak')} onkeydown={(event) => handlePartKeydown(event, 'roof', 'Stugans tak')} />
				<path class="paintable" d="M127 151H235V232H127Z" fill={coloringState.fills.cabin.wall} role="button" tabindex="0" aria-label={partLabel('wall', 'Stugans vägg')} onclick={() => paintPart('wall', 'Stugans vägg')} onkeydown={(event) => handlePartKeydown(event, 'wall', 'Stugans vägg')} />
				<path class="paintable" d="M169 178H195V232H169Z" fill={coloringState.fills.cabin.door} role="button" tabindex="0" aria-label={partLabel('door', 'Stugans dörr')} onclick={() => paintPart('door', 'Stugans dörr')} onkeydown={(event) => handlePartKeydown(event, 'door', 'Stugans dörr')} />
				<rect class="paintable" x="139" y="169" width="22" height="24" rx="2" fill={coloringState.fills.cabin.windowLeft} role="button" tabindex="0" aria-label={partLabel('windowLeft', 'Vänstra fönstret')} onclick={() => paintPart('windowLeft', 'Vänstra fönstret')} onkeydown={(event) => handlePartKeydown(event, 'windowLeft', 'Vänstra fönstret')} />
				<rect class="paintable" x="203" y="169" width="22" height="24" rx="2" fill={coloringState.fills.cabin.windowRight} role="button" tabindex="0" aria-label={partLabel('windowRight', 'Högra fönstret')} onclick={() => paintPart('windowRight', 'Högra fönstret')} onkeydown={(event) => handlePartKeydown(event, 'windowRight', 'Högra fönstret')} />
				<path class="paintable" d="M69 226H100L92 205H99L87 179L75 205H82Z" fill={coloringState.fills.cabin.pineLeft} role="button" tabindex="0" aria-label={partLabel('pineLeft', 'Vänstra granen')} onclick={() => paintPart('pineLeft', 'Vänstra granen')} onkeydown={(event) => handlePartKeydown(event, 'pineLeft', 'Vänstra granen')} />
				<path class="paintable" d="M266 226H301L292 202H300L285 170L271 202H279Z" fill={coloringState.fills.cabin.pineRight} role="button" tabindex="0" aria-label={partLabel('pineRight', 'Högra granen')} onclick={() => paintPart('pineRight', 'Högra granen')} onkeydown={(event) => handlePartKeydown(event, 'pineRight', 'Högra granen')} />
			</svg>
			<!-- End cabin motif -->
		{:else}
			<!-- Leaf motif -->
			<svg viewBox="0 0 360 300" role="group" aria-labelledby="leaf-title leaf-description">
				<title id="leaf-title">Ett stort löv att färglägga</title>
				<desc id="leaf-description">Välj en färg och använd lövets delar som knappar. Du kan också nå dem med tabbtangenten.</desc>

				<rect class="leaf-sky" x="16" y="14" width="328" height="258" rx="28" />
				<path class="leaf-ground leaf-ground-back" d="M16 218C76 183 126 202 174 221C224 241 278 189 344 211V272H16Z" />
				<path class="leaf-ground leaf-ground-front" d="M16 242C79 218 128 234 178 246C235 260 287 222 344 235V272H16Z" />
				<circle class="leaf-light" cx="291" cy="61" r="19" />

				<path class="paintable" d="M180 38C147 49 120 75 105 108C130 109 157 94 180 72Z" fill={coloringState.fills.leaf.upperLeft} role="button" tabindex="0" aria-label={partLabel('upperLeft', 'Lövets övre vänstra del')} onclick={() => paintPart('upperLeft', 'Lövets övre vänstra del')} onkeydown={(event) => handlePartKeydown(event, 'upperLeft', 'Lövets övre vänstra del')} />
				<path class="paintable" d="M180 38C213 49 240 75 255 108C230 109 203 94 180 72Z" fill={coloringState.fills.leaf.upperRight} role="button" tabindex="0" aria-label={partLabel('upperRight', 'Lövets övre högra del')} onclick={() => paintPart('upperRight', 'Lövets övre högra del')} onkeydown={(event) => handlePartKeydown(event, 'upperRight', 'Lövets övre högra del')} />
				<path class="paintable" d="M105 108C94 135 97 165 111 190C136 176 158 151 180 118V72C157 94 130 109 105 108Z" fill={coloringState.fills.leaf.middleLeft} role="button" tabindex="0" aria-label={partLabel('middleLeft', 'Lövets mellersta vänstra del')} onclick={() => paintPart('middleLeft', 'Lövets mellersta vänstra del')} onkeydown={(event) => handlePartKeydown(event, 'middleLeft', 'Lövets mellersta vänstra del')} />
				<path class="paintable" d="M255 108C266 135 263 165 249 190C224 176 202 151 180 118V72C203 94 230 109 255 108Z" fill={coloringState.fills.leaf.middleRight} role="button" tabindex="0" aria-label={partLabel('middleRight', 'Lövets mellersta högra del')} onclick={() => paintPart('middleRight', 'Lövets mellersta högra del')} onkeydown={(event) => handlePartKeydown(event, 'middleRight', 'Lövets mellersta högra del')} />
				<path class="paintable" d="M111 190C130 220 153 240 180 247V118C158 151 136 176 111 190Z" fill={coloringState.fills.leaf.lowerLeft} role="button" tabindex="0" aria-label={partLabel('lowerLeft', 'Lövets nedre vänstra del')} onclick={() => paintPart('lowerLeft', 'Lövets nedre vänstra del')} onkeydown={(event) => handlePartKeydown(event, 'lowerLeft', 'Lövets nedre vänstra del')} />
				<path class="paintable" d="M249 190C230 220 207 240 180 247V118C202 151 224 176 249 190Z" fill={coloringState.fills.leaf.lowerRight} role="button" tabindex="0" aria-label={partLabel('lowerRight', 'Lövets nedre högra del')} onclick={() => paintPart('lowerRight', 'Lövets nedre högra del')} onkeydown={(event) => handlePartKeydown(event, 'lowerRight', 'Lövets nedre högra del')} />
				<path class="leaf-stem" d="M171 232C174 250 168 265 153 278L168 284C185 268 191 251 188 232Z" />

				<path class="leaf-vein" d="M180 49V242M180 84L134 74M180 121L108 116M180 163L121 181M180 84L226 74M180 121L252 116M180 163L239 181" />
			</svg>
			<!-- End leaf motif -->
		{/if}
	</div>

	<div class="actions">
		<button type="button" class="undo-button" disabled={!canUndo} onclick={undoLatest}>Ångra senaste</button>
		<button type="button" class="reset-button" onclick={resetDrawing}>Återställ</button>
		{#if onDone}
			<button type="button" class="done-button" onclick={onDone}>Klar för nu</button>
		{/if}
	</div>
</div>

<style>
	.coloring-exercise {
		padding: 1rem;
		background:
			radial-gradient(circle at 88% 8%, rgba(233, 201, 121, 0.13), transparent 25%),
			linear-gradient(180deg, #fbfcf8 0%, #f3f7f1 100%);
	}

	.exercise-intro h2 { margin: 0; font-size: 1.16rem; line-height: 1.35; }
	.exercise-intro p { margin: 0.65rem 0 0; max-width: 62ch; line-height: 1.65; color: #47554b; }

	.motif-picker { margin-top: 1rem; }
	.motif-picker p { margin: 0 0 0.45rem; color: #314638; font-size: 0.92rem; font-weight: 650; }
	.motif-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }

	.motif-button,
	.color-button {
		min-height: 2.75rem;
		border: 1px solid rgba(57, 83, 65, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.82);
		color: #28382e;
		font: inherit;
		cursor: pointer;
		transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
	}

	.motif-button { padding: 0.5rem 0.9rem; font-size: 0.9rem; }
	.motif-button:hover,
	.color-button:hover { border-color: rgba(57, 83, 65, 0.42); background: #ffffff; }
	.motif-button.selected,
	.color-button.selected { border-color: #3e654b; box-shadow: 0 0 0 2px rgba(62, 101, 75, 0.16); }

	.palette { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); gap: 0.55rem; margin-top: 1rem; }
	.color-button { display: flex; align-items: center; gap: 0.55rem; padding: 0.5rem 0.65rem; font-size: 0.88rem; text-align: left; }
	.swatch { flex: 0 0 auto; width: 1.65rem; height: 1.65rem; border: 1px solid rgba(40, 56, 46, 0.24); border-radius: 999px; background: var(--swatch); }

	.motif-button:focus-visible,
	.color-button:focus-visible,
	.undo-button:focus-visible,
	.reset-button:focus-visible,
	.done-button:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.35); outline-offset: 2px; }

	.status { min-height: 1.5rem; margin: 0.8rem 0 0; font-size: 0.88rem; color: #526158; }
	.canvas { max-width: 31rem; margin: 0.75rem auto 0; padding: clamp(0.35rem, 2vw, 0.8rem); border: 1px solid rgba(57, 83, 65, 0.14); border-radius: 20px; background: rgba(255, 255, 255, 0.7); }
	.canvas svg { display: block; width: 100%; height: auto; }

	.sky { fill: #edf3ed; }
	.evening-sky { fill: #e9edf2; }
	.star { fill: #d3b96f; opacity: 0.7; pointer-events: none; }
	.hill { pointer-events: none; }
	.hill-back { fill: #d7e3d2; }
	.hill-front { fill: #b9cfb2; }
	.stem { fill: none; stroke: #607d62; stroke-width: 8; stroke-linecap: round; }
	.lake-line { fill: none; stroke: #8ca8a4; stroke-width: 3; stroke-linecap: round; opacity: 0.7; pointer-events: none; }
	.leaf-sky { fill: #edf2ea; }
	.leaf-ground { pointer-events: none; }
	.leaf-ground-back { fill: #d8e3d1; }
	.leaf-ground-front { fill: #c0d1b8; }
	.leaf-light { fill: #e9c979; opacity: 0.34; pointer-events: none; }
	.leaf-vein { fill: none; stroke: #526958; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; opacity: 0.8; pointer-events: none; }
	.leaf-stem { fill: #fffaf2; stroke: #526958; stroke-width: 2.5; stroke-linejoin: round; pointer-events: none; }

	.paintable {
		stroke: #526958;
		stroke-width: 2.5;
		stroke-linejoin: round;
		cursor: pointer;
		touch-action: manipulation;
		transition: fill 180ms ease, stroke-width 120ms ease, filter 120ms ease;
	}
	.paintable:hover { filter: brightness(0.97); stroke-width: 3.5; }
	.paintable:focus-visible { outline: none; stroke: #1d4ed8; stroke-width: 5; }

	.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.55rem; margin-top: 0.85rem; }
	.undo-button,
	.reset-button,
	.done-button { min-height: 2.75rem; padding: 0.55rem 1rem; border: 1px solid rgba(57, 83, 65, 0.28); border-radius: 999px; background: #ffffff; color: #314638; font: inherit; font-weight: 600; cursor: pointer; }
	.undo-button:hover:not(:disabled),
	.reset-button:hover { background: #f3f6f1; }
	.undo-button:disabled { cursor: default; opacity: 0.48; }
	.done-button { border-color: rgba(62, 101, 75, 0.42); background: #e8f0e6; color: #294032; }
	.done-button:hover { background: #dce9d9; }

	:global(.dark) .coloring-exercise { background: radial-gradient(circle at 88% 8%, rgba(233, 201, 121, 0.08), transparent 25%), linear-gradient(180deg, #111827 0%, #152019 100%); }
	:global(.dark) .exercise-intro p,
	:global(.dark) .motif-picker p,
	:global(.dark) .status { color: #c3d0c6; }
	:global(.dark) .motif-button,
	:global(.dark) .color-button,
	:global(.dark) .undo-button,
	:global(.dark) .reset-button { border-color: rgba(196, 219, 201, 0.24); background: #1d2921; color: #edf5ef; }
	:global(.dark) .motif-button:hover,
	:global(.dark) .color-button:hover,
	:global(.dark) .undo-button:hover:not(:disabled),
	:global(.dark) .reset-button:hover { background: #25332a; }
	:global(.dark) .done-button { border-color: rgba(169, 203, 176, 0.46); background: #294332; color: #edf5ef; }
	:global(.dark) .done-button:hover { background: #34543e; }
	:global(.dark) .motif-button.selected,
	:global(.dark) .color-button.selected { border-color: #a9cbb0; box-shadow: 0 0 0 2px rgba(169, 203, 176, 0.2); }
	:global(.dark) .canvas { border-color: rgba(196, 219, 201, 0.18); background: rgba(17, 24, 39, 0.7); }

	@media (max-width: 480px) {
		.coloring-exercise { padding: 0.95rem 0.85rem; }
		.palette { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.color-button { padding: 0.45rem 0.5rem; font-size: 0.82rem; }
	}

	@media (prefers-reduced-motion: reduce) {
		.motif-button,
		.color-button,
		.paintable { transition: none; }
	}
</style>
