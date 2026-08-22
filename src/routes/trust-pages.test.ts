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
});
