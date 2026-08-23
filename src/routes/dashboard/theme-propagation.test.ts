import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardSource = readFileSync(join(process.cwd(), 'src/routes/dashboard/+page.svelte'), 'utf8');
const toggleSource = readFileSync(join(process.cwd(), 'src/lib/components/ThemeToggle.svelte'), 'utf8');

describe('dashboardens theme-propagation', () => {
	it('ärver globala dashboard-tokens för UI-chrome', () => {
		expect(dashboardSource).toContain('--mp-card: var(--color-dashboard-surface);');
		expect(dashboardSource).toContain('--mp-text: var(--color-dashboard-text);');
		expect(dashboardSource).toContain('--mp-text-dim: var(--color-dashboard-text-muted);');
		expect(dashboardSource).toContain('background: var(--color-dashboard-surface-strong) !important;');
		expect(dashboardSource).not.toContain('background: #091321 !important;');
	});

	it('behåller världsscenen frikopplad från UI-theme', () => {
		expect(dashboardSource).toContain("background: #101b2b;");
		expect(dashboardSource).toContain(".companion-hero[data-time='night']");
	});

	it('har en direkt tillgänglig toggle utan meny', () => {
		expect(toggleSource).toContain("aria-label={getThemeToggleLabel(dark ? 'dark' : 'light')}");
		expect(toggleSource).toContain('aria-pressed={dark}');
		expect(toggleSource).not.toContain('role="menu"');
	});
});
