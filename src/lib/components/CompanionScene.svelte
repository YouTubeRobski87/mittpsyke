<!--
	CompanionScene – ambient canvas-lager ovanpå björnbilden.

	FÖLJESLAGARPRINCIPEN:
	Inget i scenen reagerar på användaren. Allt drivs av tid och slump.
	Rörelserna ska vara långsamma, glesa och nästan omärkliga – närvaro,
	inte animation. Världen lever för sin egen skull.

	Canvas ligger som ett transparent lager (pointer-events: none) ovanpå
	den befintliga bild-bakgrunden. Effekterna anpassas efter timeOfDay.
	Loopen respekterar prefers-reduced-motion och pausar när fliken döljs.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { TimeOfDay } from '$lib/utils/getTimeOfDay';

	let { timeOfDay = 'dag' }: { timeOfDay?: TimeOfDay } = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);

	// ── Icke-reaktivt internt tillstånd (muteras varje frame) ──
	let ctx: CanvasRenderingContext2D | null = null;
	let rafId = 0;
	let running = false;
	let reduceMotion = false;
	let lastTime = 0;
	let width = 0;
	let height = 0;
	let dpr = 1;
	let seeded = false;

	// Sätts till faktiskt timeOfDay i onMount och hålls i synk via $effect.
	let mode: TimeOfDay = 'dag';

	// Palett (RGB-kanaler) läses en gång från scopade CSS-variabler.
	type Rgb = [number, number, number];
	const palette = {
		leaf: [150, 122, 74] as Rgb,
		mist: [222, 228, 232] as Rgb,
		mote: [244, 238, 214] as Rgb,
		spark: [246, 234, 190] as Rgb,
		star: [226, 234, 255] as Rgb,
		butterfly: [224, 206, 236] as Rgb
	};

	type Leaf = {
		baseX: number;
		x: number;
		y: number;
		vy: number;
		size: number;
		rot: number;
		rotSpeed: number;
		swayAmp: number;
		swayFreq: number;
		phase: number;
		alpha: number;
	};
	type Mote = { x: number; y: number; vx: number; vy: number; r: number; phase: number; freq: number };
	type Band = { x: number; y: number; rx: number; ry: number; speed: number };
	type Spark = { x: number; y: number; life: number; maxLife: number; r: number };
	type Butterfly = {
		x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number;
		t: number; dur: number; flap: number; px: number; py: number;
	};

	const MAX_LEAVES = 5;
	const leaves: Leaf[] = [];
	const motes: Mote[] = [];
	const bands: Band[] = [];
	const sparks: Spark[] = [];
	let butterfly: Butterfly | null = null;

	// Slump-timers (sekunder) tills nästa händelse.
	let leafTimer = rand(8, 30);
	let flyTimer = rand(60, 160);
	let sparkTimer = rand(4, 14);

	type ModeConfig = {
		mist: number;
		motes: number;
		leaves: boolean;
		leafMin: number;
		leafMax: number;
		butterfly: boolean;
		flyMin: number;
		flyMax: number;
		sparkle: 'dew' | 'star' | 'none';
		sparkMin: number;
		sparkMax: number;
		warmth: number;
	};

	const CONFIG: Record<TimeOfDay, ModeConfig> = {
		// Morgon: drivande dimma lågt över marken + enstaka dagg-glitter.
		morgon: { mist: 0.9, motes: 0.25, leaves: false, leafMin: 90, leafMax: 160, butterfly: false, flyMin: 0, flyMax: 0, sparkle: 'dew', sparkMin: 8, sparkMax: 22, warmth: 0.16 },
		// Dag: vind (drivande motes), sällsynt fjäril, enstaka löv.
		dag: { mist: 0.12, motes: 1, leaves: true, leafMin: 60, leafMax: 150, butterfly: true, flyMin: 180, flyMax: 360, sparkle: 'none', sparkMin: 0, sparkMax: 0, warmth: 0 },
		// Kväll: dämpad vind, varmare ton, löv som faller långsamt.
		kvall: { mist: 0.3, motes: 0.2, leaves: true, leafMin: 50, leafMax: 120, butterfly: false, flyMin: 0, flyMax: 0, sparkle: 'none', sparkMin: 0, sparkMax: 0, warmth: 0.34 },
		// Natt: allt stillare – mycket svag dimma + enstaka stjärnglimt.
		natt: { mist: 0.22, motes: 0, leaves: false, leafMin: 0, leafMax: 0, butterfly: false, flyMin: 0, flyMax: 0, sparkle: 'star', sparkMin: 10, sparkMax: 26, warmth: -0.1 }
	};

	function cfg(): ModeConfig {
		return CONFIG[mode] ?? CONFIG.dag;
	}

	function rand(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	function rgba(c: Rgb, a: number): string {
		return `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${a})`;
	}

	// Värmer/kyler en färg lätt utifrån mode (positivt = varmare).
	function tint(c: Rgb, warmth: number): Rgb {
		return [
			Math.max(0, Math.min(255, c[0] + warmth * 26)),
			Math.max(0, Math.min(255, c[1] + warmth * 6)),
			Math.max(0, Math.min(255, c[2] - warmth * 24))
		];
	}

	function readPalette() {
		if (!canvas) return;
		const cs = getComputedStyle(canvas);
		const read = (name: string, fallback: Rgb): Rgb => {
			const raw = cs.getPropertyValue(name).trim();
			if (!raw) return fallback;
			const parts = raw.split(/[\s,]+/).map(Number);
			if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
				return [parts[0], parts[1], parts[2]];
			}
			return fallback;
		};
		palette.leaf = read('--cs-leaf', palette.leaf);
		palette.mist = read('--cs-mist', palette.mist);
		palette.mote = read('--cs-mote', palette.mote);
		palette.spark = read('--cs-spark', palette.spark);
		palette.star = read('--cs-star', palette.star);
		palette.butterfly = read('--cs-butterfly', palette.butterfly);
	}

	function seedAmbient() {
		bands.length = 0;
		for (let i = 0; i < 3; i++) {
			bands.push({
				x: rand(0, width),
				y: height * (0.62 + i * 0.13),
				rx: width * rand(0.45, 0.7),
				ry: height * rand(0.12, 0.2),
				speed: rand(3, 8) * (Math.random() < 0.5 ? -1 : 1)
			});
		}
		motes.length = 0;
		for (let i = 0; i < 6; i++) {
			motes.push({
				x: rand(0, width),
				y: rand(height * 0.2, height * 0.9),
				vx: rand(2, 7),
				vy: rand(-3, 1),
				r: rand(0.8, 1.8),
				phase: rand(0, Math.PI * 2),
				freq: rand(0.2, 0.5)
			});
		}
		seeded = true;
	}

	function spawnLeaf() {
		if (leaves.length >= MAX_LEAVES) return;
		const size = rand(6, 11);
		const baseX = rand(width * 0.08, width * 0.92);
		leaves.push({
			baseX,
			x: baseX,
			y: -size * 2,
			vy: rand(14, 26),
			size,
			rot: rand(0, Math.PI * 2),
			rotSpeed: rand(-0.8, 0.8),
			swayAmp: rand(8, 22),
			swayFreq: rand(0.5, 1.1),
			phase: rand(0, Math.PI * 2),
			alpha: rand(0.45, 0.72)
		});
	}

	function spawnButterfly() {
		if (butterfly) return;
		const leftToRight = Math.random() < 0.5;
		const x0 = leftToRight ? -24 : width + 24;
		const x3 = leftToRight ? width + 24 : -24;
		const yTop = rand(height * 0.22, height * 0.5);
		butterfly = {
			x0,
			y0: yTop + rand(-10, 10),
			x1: lerp(x0, x3, 0.33),
			y1: yTop - rand(20, 50),
			x2: lerp(x0, x3, 0.66),
			y2: yTop + rand(20, 60),
			x3,
			y3: yTop + rand(-10, 30),
			t: 0,
			dur: rand(7, 11),
			flap: rand(0, Math.PI * 2),
			px: x0,
			py: yTop
		};
	}

	function spawnSpark() {
		const c = cfg();
		if (c.sparkle === 'none' || sparks.length >= 4) return;
		const maxLife = rand(1.4, 2.6);
		sparks.push({
			x: rand(width * 0.08, width * 0.92),
			y: c.sparkle === 'star' ? rand(height * 0.06, height * 0.4) : rand(height * 0.66, height * 0.94),
			life: maxLife,
			maxLife,
			r: c.sparkle === 'star' ? rand(0.8, 1.6) : rand(0.6, 1.3)
		});
	}

	function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * t;
	}

	function cubic(a: number, b: number, c: number, d: number, t: number): number {
		const u = 1 - t;
		return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
	}

	function update(dt: number) {
		const c = cfg();

		// Drivande dimma.
		for (const b of bands) {
			b.x += b.speed * dt;
			if (b.x - b.rx > width) b.x = -b.rx;
			if (b.x + b.rx < 0) b.x = width + b.rx;
		}

		// Motes (vind/liv).
		if (c.motes > 0) {
			for (const m of motes) {
				m.phase += m.freq * dt;
				m.x += m.vx * dt;
				m.y += (m.vy + Math.sin(m.phase) * 2) * dt;
				if (m.x > width + 6) m.x = -6;
				if (m.x < -6) m.x = width + 6;
				if (m.y < -6) m.y = height + 6;
				if (m.y > height + 6) m.y = -6;
			}
		}

		// Löv – glesa, slumpade.
		if (c.leaves) {
			leafTimer -= dt;
			if (leafTimer <= 0) {
				spawnLeaf();
				leafTimer = rand(c.leafMin, c.leafMax);
			}
		}
		for (let i = leaves.length - 1; i >= 0; i--) {
			const l = leaves[i];
			l.phase += l.swayFreq * dt;
			l.y += l.vy * dt;
			l.x = l.baseX + Math.sin(l.phase) * l.swayAmp;
			l.rot += l.rotSpeed * dt;
			if (l.y > height + l.size * 3) leaves.splice(i, 1);
		}

		// Fjäril – ännu mer sällan, bara dagtid.
		if (c.butterfly) {
			flyTimer -= dt;
			if (flyTimer <= 0) {
				spawnButterfly();
				flyTimer = rand(c.flyMin, c.flyMax);
			}
		}
		if (butterfly) {
			butterfly.t += dt / butterfly.dur;
			butterfly.flap += dt * 9;
			if (butterfly.t >= 1) {
				butterfly = null;
			} else {
				butterfly.px = cubic(butterfly.x0, butterfly.x1, butterfly.x2, butterfly.x3, butterfly.t);
				butterfly.py = cubic(butterfly.y0, butterfly.y1, butterfly.y2, butterfly.y3, butterfly.t);
			}
		}

		// Dagg/stjärn-glimt.
		if (c.sparkle !== 'none') {
			sparkTimer -= dt;
			if (sparkTimer <= 0) {
				spawnSpark();
				sparkTimer = rand(c.sparkMin, c.sparkMax);
			}
		}
		for (let i = sparks.length - 1; i >= 0; i--) {
			sparks[i].life -= dt;
			if (sparks[i].life <= 0) sparks.splice(i, 1);
		}
	}

	function drawBand(b: Band, alpha: number, color: Rgb) {
		ctx!.save();
		ctx!.translate(b.x, b.y);
		ctx!.scale(1, b.ry / b.rx);
		const g = ctx!.createRadialGradient(0, 0, 0, 0, 0, b.rx);
		g.addColorStop(0, rgba(color, alpha));
		g.addColorStop(1, rgba(color, 0));
		ctx!.fillStyle = g;
		ctx!.beginPath();
		ctx!.arc(0, 0, b.rx, 0, Math.PI * 2);
		ctx!.fill();
		ctx!.restore();
	}

	function drawLeaf(l: Leaf, color: Rgb) {
		ctx!.save();
		ctx!.translate(l.x, l.y);
		ctx!.rotate(l.rot);
		ctx!.fillStyle = rgba(color, l.alpha);
		ctx!.beginPath();
		ctx!.moveTo(0, -l.size);
		ctx!.quadraticCurveTo(l.size * 0.7, -l.size * 0.2, 0, l.size);
		ctx!.quadraticCurveTo(-l.size * 0.7, -l.size * 0.2, 0, -l.size);
		ctx!.fill();
		ctx!.restore();
	}

	function drawButterfly(bf: Butterfly, color: Rgb) {
		let alpha = 0.5;
		if (bf.t < 0.12) alpha *= bf.t / 0.12;
		else if (bf.t > 0.88) alpha *= (1 - bf.t) / 0.12;
		const flap = 0.35 + 0.65 * Math.abs(Math.sin(bf.flap));
		const dir = Math.atan2(
			cubic(bf.y0, bf.y1, bf.y2, bf.y3, Math.min(1, bf.t + 0.02)) - bf.py,
			cubic(bf.x0, bf.x1, bf.x2, bf.x3, Math.min(1, bf.t + 0.02)) - bf.px
		);
		ctx!.save();
		ctx!.translate(bf.px, bf.py);
		ctx!.rotate(dir);
		ctx!.fillStyle = rgba(color, alpha);
		for (const s of [-1, 1]) {
			ctx!.save();
			ctx!.scale(flap, 1);
			ctx!.beginPath();
			ctx!.ellipse(0, s * 3.2, 4.5, 3, 0, 0, Math.PI * 2);
			ctx!.fill();
			ctx!.restore();
		}
		ctx!.restore();
	}

	function drawSpark(s: Spark, color: Rgb) {
		const k = s.life / s.maxLife;
		const alpha = Math.sin(k * Math.PI) * 0.6;
		ctx!.save();
		ctx!.translate(s.x, s.y);
		ctx!.fillStyle = rgba(color, alpha);
		ctx!.beginPath();
		ctx!.arc(0, 0, s.r, 0, Math.PI * 2);
		ctx!.fill();
		// liten glimt-stråle
		ctx!.strokeStyle = rgba(color, alpha * 0.8);
		ctx!.lineWidth = 0.6;
		ctx!.beginPath();
		ctx!.moveTo(-s.r * 3, 0);
		ctx!.lineTo(s.r * 3, 0);
		ctx!.moveTo(0, -s.r * 3);
		ctx!.lineTo(0, s.r * 3);
		ctx!.stroke();
		ctx!.restore();
	}

	function draw() {
		if (!ctx) return;
		ctx.clearRect(0, 0, width, height);
		const c = cfg();

		// Dimma (alltid, men styrka varierar).
		const mistColor = tint(palette.mist, c.warmth * 0.4);
		for (const b of bands) drawBand(b, 0.16 * c.mist, mistColor);

		// Motes.
		if (c.motes > 0) {
			const moteColor = tint(palette.mote, c.warmth);
			for (const m of motes) {
				ctx.fillStyle = rgba(moteColor, 0.18 * c.motes);
				ctx.beginPath();
				ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// Löv.
		const leafColor = tint(palette.leaf, c.warmth);
		for (const l of leaves) drawLeaf(l, leafColor);

		// Fjäril.
		if (butterfly) drawButterfly(butterfly, palette.butterfly);

		// Glimt.
		if (sparks.length) {
			const sparkColor = c.sparkle === 'star' ? palette.star : tint(palette.spark, c.warmth);
			for (const s of sparks) drawSpark(s, sparkColor);
		}
	}

	function frame(now: number) {
		if (!running) return;
		const dt = Math.min(0.05, (now - lastTime) / 1000) || 0;
		lastTime = now;
		update(dt);
		draw();
		rafId = requestAnimationFrame(frame);
	}

	function start() {
		if (running || reduceMotion || !ctx || width === 0 || height === 0) return;
		if (typeof document !== 'undefined' && document.hidden) return;
		running = true;
		lastTime = performance.now();
		rafId = requestAnimationFrame(frame);
	}

	function stop() {
		running = false;
		if (rafId) cancelAnimationFrame(rafId);
		rafId = 0;
	}

	function resize() {
		if (!canvas || !ctx) return;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (w === 0 || h === 0) return;
		dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
		width = w;
		height = h;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		if (!seeded) seedAmbient();
		// För reduced-motion: rita en stilla ruta (rensa) en gång.
		if (reduceMotion) {
			ctx.clearRect(0, 0, width, height);
		}
	}

	// Reagera på ändrad timeOfDay: byt mode och nollställ glesa timers.
	$effect(() => {
		mode = timeOfDay;
		const c = CONFIG[mode] ?? CONFIG.dag;
		if (c.leaves) leafTimer = rand(8, Math.max(12, c.leafMin));
		if (c.butterfly) flyTimer = rand(Math.max(30, c.flyMin * 0.3), c.flyMax);
		if (c.sparkle !== 'none') sparkTimer = rand(4, c.sparkMax);
	});

	onMount(() => {
		if (!canvas) return;
		ctx = canvas.getContext('2d');
		if (!ctx) return;

		mode = timeOfDay;

		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = motionQuery.matches;

		readPalette();
		resize();

		const ro = new ResizeObserver(() => {
			resize();
			if (!running) start();
		});
		ro.observe(canvas);

		const onVisibility = () => {
			if (document.hidden) stop();
			else start();
		};
		const onMotionChange = () => {
			reduceMotion = motionQuery.matches;
			if (reduceMotion) {
				stop();
				if (ctx) ctx.clearRect(0, 0, width, height);
			} else {
				start();
			}
		};

		document.addEventListener('visibilitychange', onVisibility);
		motionQuery.addEventListener('change', onMotionChange);

		start();

		return () => {
			stop();
			ro.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			motionQuery.removeEventListener('change', onMotionChange);
			ctx = null;
		};
	});
</script>

<canvas bind:this={canvas} class="companion-canvas" aria-hidden="true"></canvas>

<style>
	.companion-canvas {
		/* Scopade tints – kan överskridas av föräldern utan globala selektorer. */
		--cs-leaf: 150 122 74;
		--cs-mist: 222 228 232;
		--cs-mote: 244 238 214;
		--cs-spark: 246 234 190;
		--cs-star: 226 234 255;
		--cs-butterfly: 224 206 236;

		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		pointer-events: none;
	}
</style>
