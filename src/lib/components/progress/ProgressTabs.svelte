<script lang="ts">
	export type ProgressTab = 'place' | 'insights' | 'mood' | 'development';

	let {
		active,
		onSelect
	}: {
		active: ProgressTab;
		onSelect: (tab: ProgressTab) => void;
	} = $props();

	const tabs = [
		{ id: 'place', label: 'Min plats' },
		{ id: 'insights', label: 'Mina insikter' },
		{ id: 'mood', label: 'Humör och mönster' },
		{ id: 'development', label: 'Min utveckling' }
	] as const;

	function navigate(event: KeyboardEvent, index: number) {
		const last = tabs.length - 1;
		const target = {
			ArrowLeft: (index + last) % tabs.length,
			ArrowRight: (index + 1) % tabs.length,
			Home: 0,
			End: last
		}[event.key as 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End'];
		if (target === undefined) return;

		event.preventDefault();
		const id = tabs[target].id;
		onSelect(id);
		document.getElementById('progress-tab-' + id)?.focus();
	}
</script>

<div class="progress-tabs" role="tablist" aria-label="Framsteg">
	{#each tabs as tab, index (tab.id)}
		<button
			type="button"
			role="tab"
			id={'progress-tab-' + tab.id}
			aria-controls={'progress-panel-' + tab.id}
			aria-selected={active === tab.id}
			tabindex={active === tab.id ? 0 : -1}
			onclick={() => onSelect(tab.id)}
			onkeydown={(event) => navigate(event, index)}
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.progress-tabs {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
	}

	button {
		min-height: 44px;
		padding: 0.55rem 0.4rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		font: inherit;
		cursor: pointer;
	}

	button[aria-selected='true'] {
		border-color: currentColor;
		background: hsl(var(--muted));
		font-weight: 700;
	}

	button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	@media (min-width: 640px) {
		.progress-tabs {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
</style>
