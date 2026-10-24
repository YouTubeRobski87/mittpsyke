import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workspace = process.cwd();
const component = readFileSync(
	join(workspace, 'src/lib/components/LocalEntriesImportPrompt.svelte'),
	'utf8'
);
const kvallsstugan = readFileSync(
	join(workspace, 'src/routes/dashboard/kvallsstugan/+page.svelte'),
	'utf8'
);
const kvallsstuganServer = readFileSync(
	join(workspace, 'src/routes/dashboard/kvallsstugan/+page.server.ts'),
	'utf8'
);

describe('import av lokal historik till kontot', () => {
	// Flyttad hit från gamla /dashboard (nu borttagen) i samband med att Mitt
	// Hem blev Kvällstugan. Ingen egen isAnonymous-koll behövs: Kvällstugans
	// server-load redirectar redan bort utloggade och anonyma besökare innan
	// sidan renderas.
	it('finns i Kvällstugan, som redan bara nås inloggad', () => {
		expect(kvallsstugan).toContain(
			"import LocalEntriesImportPrompt from '$lib/components/LocalEntriesImportPrompt.svelte';"
		);
		expect(kvallsstugan).toContain('<LocalEntriesImportPrompt />');
		expect(kvallsstuganServer).toContain('if (!user || user.is_anonymous)');
	});

	it('läser lokala inlägg vid mount, men skickar ingen nätverksrequest automatiskt', () => {
		expect(component).toContain('entries = readLocalEntries();');
		// onMount hämtar bara sessionen för samtyckesläget - fetch sker först i
		// importSelected(), som i sin tur bara triggas av knappklicket.
		expect(component).toMatch(/onMount\(async \(\) => \{[\s\S]*?\}\);/);
		const onMountBody = component.match(/onMount\(async \(\) => \{([\s\S]*?)\n\t\}\);/)?.[1] ?? '';
		expect(onMountBody).not.toMatch(/fetch\(/);
	});

	it('inget importeras utan aktivt val - knappen är spärrad utan urval', () => {
		expect(component).toContain('disabled={importing || busy || selectedCount === 0}');
		expect(component).toContain('if (importing || busy || selectedCount === 0) return;');
		expect(component).toContain('const selectedCount = $derived(selected.size);');
	});

	it('bara /api/diary/create anropas - ingen AI-reflektion, analys eller insikt', () => {
		expect(component).toContain("fetch('/api/diary/create'");
		expect(component).not.toMatch(/\/api\/diary\/(reflect|insights|checkin-reflection)/);
		expect(component).not.toMatch(/track\w+\(/);
		expect(component).not.toMatch(/gtag\(/);
	});

	it('raderar bara det inlägg som faktiskt sparades, i success-grenen', () => {
		// Själva regeln testas beteendemässigt i diary-local-import.test.ts.
		// Här vaktas att komponenten bara rensar lokalt i bekräftelse-callbacken
		// och bara räknar ett svar som bekräftat när servern sagt success.
		expect(component).toContain('return response.ok && result?.success === true;');
		expect(component).toMatch(/\(item\) => \{\s*\/\/[^\n]*\n[^\n]*\n\s*confirmLocalEntryImported\(item\);/);
		expect(component).not.toContain('deleteLocalEntry');
	});

	it('förklarar kort att lokala inlägg hittills bara funnits i webbläsaren', () => {
		expect(component).toContain('bara funnits i den här webbläsaren');
		expect(component).toContain('sparas till ditt konto');
	});

	it('kräver samtycke innan sparning, som den inloggade dagboken redan gör', () => {
		expect(component).toContain("import ConsentGate from '$lib/components/ConsentGate.svelte';");
		expect(component).toContain('{#if !hasConsent}');
	});

	it('erbjuder att avstå utan att röra den lokala historiken', () => {
		expect(component).toContain('function dismiss() {');
		expect(component).toContain('Inte nu');
		const dismissBody = component.match(/function dismiss\(\) \{([\s\S]*?)\n\t\}/)?.[1] ?? '';
		expect(dismissBody).not.toContain('deleteLocalEntry');
		expect(dismissBody).not.toContain('clearLocalEntries');
	});
});
