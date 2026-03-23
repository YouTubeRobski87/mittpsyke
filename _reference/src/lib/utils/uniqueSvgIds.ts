/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

/**
 * Generates a random ID suffix for uniqueness
 */
function randomId(): string {
	return Math.random().toString(36).slice(2, 10);
}

/**
 * Makes SVG IDs and CSS class names unique by replacing all id="...",
 * url(#...) references, and class definitions/usages with instance-specific
 * versions. This prevents gradient/filter conflicts when different SVGs
 * with the same IDs or class names are rendered on the same page.
 */
export function uniqueSvgIds(svg: string): string {
	const instanceId = randomId();
	const idMap = new Map<string, string>();
	const classMap = new Map<string, string>();

	// Find all id="..." and create unique replacements
	const idRegex = /\bid="([^"]+)"/g;
	let match;
	while ((match = idRegex.exec(svg)) !== null) {
		const originalId = match[1];
		if (!idMap.has(originalId)) {
			idMap.set(originalId, `${originalId}_${instanceId}`);
		}
	}

	// Find all CSS class definitions in <style> blocks (e.g., .d { or .cls-1 {)
	// Match class names that are single letters or common patterns like cls-1
	const classDefRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g;
	while ((match = classDefRegex.exec(svg)) !== null) {
		const originalClass = match[1];
		if (!classMap.has(originalClass)) {
			classMap.set(originalClass, `${originalClass}_${instanceId}`);
		}
	}

	// Replace all occurrences of the IDs
	let result = svg;
	for (const [originalId, newId] of idMap) {
		const escaped = escapeRegex(originalId);
		// Replace id="originalId"
		result = result.replace(new RegExp(`\\bid="${escaped}"`, 'g'), `id="${newId}"`);
		// Replace url(#originalId)
		result = result.replace(new RegExp(`url\\(#${escaped}\\)`, 'g'), `url(#${newId})`);
		// Replace href="#originalId" (for use elements)
		result = result.replace(new RegExp(`href="#${escaped}"`, 'g'), `href="#${newId}"`);
		// Replace xlink:href="#originalId" (legacy)
		result = result.replace(new RegExp(`xlink:href="#${escaped}"`, 'g'), `xlink:href="#${newId}"`);
	}

	// Replace all occurrences of CSS classes
	for (const [originalClass, newClass] of classMap) {
		const escaped = escapeRegex(originalClass);
		// Replace class definitions in <style>: .className { -> .className_xxx {
		result = result.replace(new RegExp(`\\.${escaped}(\\s*\\{)`, 'g'), `.${newClass}$1`);
		// Replace class usages in class="..." attributes
		// This handles: class="d", class="d e f", class="d e" etc.
		result = result.replace(
			new RegExp(`class="([^"]*)"`, 'g'),
			(_match, classValue: string) => {
				const classes = classValue.split(/\s+/);
				const updatedClasses = classes.map((c) => classMap.get(c) || c);
				return `class="${updatedClasses.join(' ')}"`;
			}
		);
	}

	return result;
}
