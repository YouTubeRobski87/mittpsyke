/**
 * Bildankrad geometri för scener som visas med `object-fit: cover`.
 *
 * Bakgrunden i Mitt Hem är ett foto som beskärs av `cover`, medan
 * världslagren i AmbientWorld ligger i procent av scenrutan. De två
 * koordinatsystemen glider isär så fort rutans proportioner ändras: månen
 * hamnar framför träden, och lövverket uppe till höger svajar över öppet
 * vatten på mobil.
 *
 * Här bor den rena matematiken för att gå från en punkt i originalbilden till
 * en punkt i den synliga scenrutan. Modulen känner varken till DOM, Svelte
 * eller någon enskild scen - den tar mått in och ger mått ut.
 *
 * Tre koordinatrymder hålls medvetet isär i världen:
 *
 * - **bildrymd** (den här modulen): 0-1 av originalbilden. För lager som
 *   representerar en fysisk punkt i fotot - en trädkrona, en himmelsyta.
 * - **scenrymd**: procent av scenrutan. För lager som ska följa rutan, till
 *   exempel dimbanden som spänner över hela bredden.
 * - **fri ambientrymd**: lager utan geografisk innebörd, som moln som driver
 *   förbi eller en fågel som glider genom bild.
 *
 * Endast bildrymden går genom den här modulen.
 */

export type CoverGeometryInput = {
	/** Originalbildens intrinsiska bredd i pixlar. */
	imageWidth: number;
	/** Originalbildens intrinsiska höjd i pixlar. */
	imageHeight: number;
	/** Scenrutans bredd i pixlar. */
	containerWidth: number;
	/** Scenrutans höjd i pixlar. */
	containerHeight: number;
	/** `object-position` X som andel 0-1. CSS `50%` = 0.5. Standard: 0.5. */
	objectPositionX?: number;
	/** `object-position` Y som andel 0-1. CSS `52%` = 0.52. Standard: 0.5. */
	objectPositionY?: number;
};

export type CoverGeometry = {
	/** Bildens uppskalade bredd i pixlar - alltid >= containerWidth. */
	renderedWidth: number;
	/** Bildens uppskalade höjd i pixlar - alltid >= containerHeight. */
	renderedHeight: number;
	/** Bildens vänsterkant relativt rutans vänsterkant. Alltid <= 0. */
	offsetX: number;
	/** Bildens överkant relativt rutans överkant. Alltid <= 0. */
	offsetY: number;
};

function toFiniteNumber(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp01(value: number): number {
	if (value <= 0) return 0;
	if (value >= 1) return 1;
	return value;
}

/**
 * Räknar ut exakt samma geometri som CSS `object-fit: cover` med
 * `object-position`.
 *
 * `cover` skalar bilden med den *största* av de två skalfaktorerna, så att
 * båda axlarna täcker rutan och minst en av dem spiller över. Överspillet
 * fördelas sedan av `object-position`: värdet anger vilken punkt i bilden som
 * ska ligga på motsvarande punkt i rutan, vilket ger offset = (ruta -
 * renderad) * position. Positionen är negativ eller noll per definition,
 * eftersom den renderade bilden aldrig är mindre än rutan.
 *
 * Ogiltiga eller icke-positiva mått ger en nollgeometri i stället för NaN, så
 * en anropare aldrig kan råka skriva `NaN%` i en stilsträng.
 */
export function getCoverGeometry(input: CoverGeometryInput): CoverGeometry {
	const imageWidth = toFiniteNumber(input.imageWidth, 0);
	const imageHeight = toFiniteNumber(input.imageHeight, 0);
	const containerWidth = toFiniteNumber(input.containerWidth, 0);
	const containerHeight = toFiniteNumber(input.containerHeight, 0);

	if (imageWidth <= 0 || imageHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
		return { renderedWidth: 0, renderedHeight: 0, offsetX: 0, offsetY: 0 };
	}

	const objectPositionX = clamp01(toFiniteNumber(input.objectPositionX, 0.5));
	const objectPositionY = clamp01(toFiniteNumber(input.objectPositionY, 0.5));

	// Det som gör det till cover och inte contain: största skalan, inte minsta.
	const scale = Math.max(containerWidth / imageWidth, containerHeight / imageHeight);
	const renderedWidth = imageWidth * scale;
	const renderedHeight = imageHeight * scale;

	return {
		renderedWidth,
		renderedHeight,
		offsetX: (containerWidth - renderedWidth) * objectPositionX,
		offsetY: (containerHeight - renderedHeight) * objectPositionY
	};
}

/** En punkt i originalbilden, 0-1 från bildens övre vänstra hörn. */
export type ImagePoint = {
	x: number;
	y: number;
};

export type ScenePoint = {
	/** Pixlar från scenrutans vänsterkant. Kan vara negativ. */
	x: number;
	/** Pixlar från scenrutans överkant. Kan vara negativ. */
	y: number;
	/** Samma punkt som procent av rutans bredd. */
	xPercent: number;
	/** Samma punkt som procent av rutans höjd. */
	yPercent: number;
	/** Falskt när punkten beskurits bort - då ska lagret döljas, inte flyttas. */
	visible: boolean;
};

/**
 * Översätter en punkt i originalbilden till dess läge i den synliga
 * scenrutan. En punkt på ett visst träd i fotot hamnar alltså på samma träd
 * oavsett hur `cover` beskär bilden.
 *
 * `visible` är falskt när punkten hamnar utanför rutan. Anroparen ska då
 * dölja lagret - aldrig klampa in det, för då skulle det påstå en geografisk
 * position det inte har.
 */
export function imagePointToScenePoint(
	point: ImagePoint,
	input: CoverGeometryInput
): ScenePoint {
	const geometry = getCoverGeometry(input);
	const containerWidth = toFiniteNumber(input.containerWidth, 0);
	const containerHeight = toFiniteNumber(input.containerHeight, 0);

	if (geometry.renderedWidth <= 0 || geometry.renderedHeight <= 0) {
		return { x: 0, y: 0, xPercent: 0, yPercent: 0, visible: false };
	}

	const pointX = toFiniteNumber(point.x, 0);
	const pointY = toFiniteNumber(point.y, 0);
	const x = geometry.offsetX + pointX * geometry.renderedWidth;
	const y = geometry.offsetY + pointY * geometry.renderedHeight;

	return {
		x,
		y,
		xPercent: (x / containerWidth) * 100,
		yPercent: (y / containerHeight) * 100,
		visible: x >= 0 && x <= containerWidth && y >= 0 && y <= containerHeight
	};
}

/**
 * Ett bildankrat lager: en punkt, och valfritt en storlek, uttryckta som
 * andelar av originalbilden.
 */
export type ImageAnchor = {
	x: number;
	y: number;
	/** Bredd som andel av bildens bredd. Utelämnad = lagret behåller sin egen bredd. */
	width?: number;
	/** Höjd som andel av bildens höjd. Utelämnad = lagret behåller sin egen höjd. */
	height?: number;
};

/**
 * CSS-variablerna för ett bildankrat lager.
 *
 * Själva omräkningen sker i CSS med container query-enheter, inte här: samma
 * formel som `getCoverGeometry` går att skriva som
 *
 *     renderedWidth  = max(100cqw, 100cqh * aspect)
 *     renderedHeight = max(100cqh, 100cqw / aspect)
 *     left           = (100cqw - renderedWidth) * positionX + imageX * renderedWidth
 *
 * vilket är exakt `Math.max(cw / iw, ch / ih) * iw` respektive
 * `(cw - renderedWidth) * positionX + imageX * renderedWidth` uttryckt i
 * rutans egna enheter. Det gör att lagret sitter rätt redan vid första
 * målningen, utan att någon mäter DOM:en eller lyssnar på resize. Funktionen
 * ovan är den testbara specifikationen som CSS:en speglar, och den används i
 * browser-QA för att verifiera att de två stämmer överens.
 *
 * `aspect` och `object-position` kommer inte härifrån utan ärvs från scenen
 * (`--scene-image-aspect`, `--scene-image-pos-x/y`), så samma mediefråga som
 * byter `object-position` byter också ankringen.
 */
export function imageAnchorStyle(anchor: ImageAnchor): string {
	return [
		`--img-x: ${anchor.x}`,
		`--img-y: ${anchor.y}`,
		anchor.width !== undefined ? `--img-w: ${anchor.width}` : '',
		anchor.height !== undefined ? `--img-h: ${anchor.height}` : ''
	]
		.filter(Boolean)
		.join('; ');
}

/**
 * Vilket ankarläge lagret ska rita i. `image-box` tar även storleken från
 * bilden; `image` behåller lagrets egen storlek och flyttar bara punkten.
 */
export function imageAnchorMode(anchor: ImageAnchor): 'image' | 'image-box' {
	return anchor.width !== undefined && anchor.height !== undefined ? 'image-box' : 'image';
}
