import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('trust pages', () => {
	it('keeps the homepage local-diary promise tied to verified dataflow copy', () => {
		const source = projectFile('./+page.svelte');
		expect(source).toContain('dataflowCopy.anonymousDiary.short');
	});

	it('does not show an unverified postal-address placeholder', () => {
		const source = projectFile('./kontakt-och-villkor/+page.svelte');
		expect(source).not.toMatch(/Kompletteras/i);
	});

	it('does not hardcode the support-chat model on the responsible-AI page', () => {
		const source = projectFile('./ansvarsfull-ai/+page.svelte');
		expect(source).toContain('data.supportChatModel');
		expect(source).not.toContain('gpt-4o-mini');
	});

	// Gästchatten lagras inte någonstans: /api/chat returnerar gästsvar utan
	// databasskrivning och med conversationId: null. Sidan påstod tidigare att
	// samtalet "sparas separat som ett gästsamtal", vilket beskrev en arkitektur
	// som tagits bort. Bind påståendet till den verifierade dataflödestexten.
	it('describes guest chat as unstored on the responsible-AI page', () => {
		const source = projectFile('./ansvarsfull-ai/+page.svelte');
		expect(source).toContain('dataflowCopy.guestChat.retention');
		expect(source).not.toMatch(/sparas samtalet\s*\n?\s*separat som ett gästsamtal/);
	});

	it('keeps the guest chat endpoint free of conversation storage', () => {
		const source = projectFile('./api/chat/+server.ts');
		const guestBranch = source.slice(
			source.indexOf('if (!token) {'),
			source.indexOf('const supabaseUrl = env.SUPABASE_URL')
		);
		expect(guestBranch.length).toBeGreaterThan(0);
		expect(guestBranch).toContain("conversationId: null");
		expect(guestBranch).not.toMatch(/\.from\((['"])(guest_)?(conversations|messages)\1\)/);
	});

	// Ahrefs laddas inuti den samtyckesgrindade initializern, så tabellens
	// rättsliga grund måste vara samtycke - inte berättigat intresse.
	it('lists consent as the legal basis for Ahrefs web analytics', () => {
		const source = projectFile('./integritet/+page.svelte');
		const ahrefsRow = source.slice(
			source.indexOf('Cookie-fri webbstatistik'),
			source.indexOf('Cookie-fri webbstatistik') + 400
		);
		expect(ahrefsRow).toContain('Ahrefs Web Analytics');
		expect(ahrefsRow).toContain('Samtycke');
		expect(ahrefsRow).not.toContain('Berättigat intresse');
	});

	// Publika förtroendesidor ska tala om användarens data, inte om hur
	// kodbasen granskats.
	it('keeps internal audit register off the public trust pages', () => {
		for (const path of [
			'./integritet/+page.svelte',
			'./cookies-och-leverantorer/+page.svelte',
			'./ansvarsfull-ai/+page.svelte'
		]) {
			expect(projectFile(path)).not.toMatch(/behöver bekräftas|programkod|kodbasen/i);
		}
	});
});
