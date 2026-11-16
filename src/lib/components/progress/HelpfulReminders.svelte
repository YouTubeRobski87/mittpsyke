<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		activeHelpfulReminders,
		mergeHelpfulReminderStates,
		readHelpfulReminderStates,
		HELPFUL_REMINDER_LABELS,
		HELPFUL_REMINDER_OPTIONS,
		type HelpfulReminder,
		type HelpfulReminderState
	} from '$lib/progress-helpful-reminders';

	let { accountId, initial }: { accountId: string; initial: HelpfulReminderState[] | null } = $props();
	let saved = $state<HelpfulReminderState[] | null>(null);
	const snapshot = $derived(mergeHelpfulReminderStates(initial ?? [], saved ?? []));
	const ready = $derived(initial !== null || saved !== null);
	const reminders = $derived(activeHelpfulReminders(snapshot));
	const available = $derived(HELPFUL_REMINDER_OPTIONS.filter((item) => !reminders.includes(item)));
	let selected = $state<HelpfulReminder | ''>('');
	let saving = $state(false);
	let message = $state('');
	let error = $state('');
	let picker = $state<HTMLSelectElement>();
	let heading = $state<HTMLHeadingElement>();

	async function refresh() {
		try {
			const response = await fetch('/api/progress/helpful-reminders', {
				headers: { 'X-MittPsyke-Account-Id': accountId },
				cache: 'no-store', signal: AbortSignal.timeout(8000)
			});
			if (!response.ok) return false;
			const payload = await response.json();
			saved = mergeHelpfulReminderStates(saved ?? [], readHelpfulReminderStates(payload.reminders));
			return true;
		} catch {
			return false;
		}
	}

	async function refreshOnFocus() {
		if (saving) return;
		const wasReady = ready;
		const loaded = await refresh();
		if (loaded && !wasReady && !saving) error = '';
		if (!loaded && !ready) error = 'Listan kunde inte hämtas. Försök ladda om sidan.';
	}

	onMount(() => {
		if (!ready) void refreshOnFocus();
	});

	async function change(item: HelpfulReminder, action: 'add' | 'remove') {
		if (saving || !ready) return;
		saving = true;
		error = '';
		message = '';
		const revision = snapshot.find((row) => row.item_id === item)?.revision ?? 0;
		const active = action === 'add';
		let conflict = false;
		try {
			const response = await fetch('/api/progress/helpful-reminders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accountId, item, action, revision }),
				signal: AbortSignal.timeout(8000)
			});
			conflict = response.status === 409;
			if (!response.ok) throw new Error();
			const payload = await response.json();
			const [row] = readHelpfulReminderStates([payload.reminder]);
			if (row.item_id !== item || row.active !== active || row.revision !== revision + 1) throw new Error();
			saved = mergeHelpfulReminderStates(saved ?? [], [row]);
			selected = '';
			if (snapshot.find((current) => current.item_id === item)?.revision === row.revision) {
				const label = HELPFUL_REMINDER_LABELS[item];
				message = active ? label + ' finns nu på din lista.' : label + ' har tagits bort från din lista.';
			}
		} catch {
			const loaded = await refresh();
			if (selected && reminders.includes(selected)) selected = '';
			error = loaded
				? conflict
					? 'Valet ändrades i en annan flik eller på en annan enhet. Listan har uppdaterats.'
					: 'Ändringen kunde inte bekräftas. Listan har hämtats på nytt.'
				: 'Ändringen kunde inte bekräftas och listan kunde inte hämtas. Försök ladda om sidan.';
		} finally {
			saving = false;
		}
		await tick();
		(picker ?? heading)?.focus();
	}
</script>

<svelte:window onfocus={refreshOnFocus} />

<h2 id="helpful-reminders-heading" bind:this={heading} tabindex="-1">Det här vill jag komma ihåg</h2>
<p>Välj något du själv vill komma ihåg. Listan sparas i ditt konto.</p>

{#if reminders.length > 0}
	<ul class="reminders">
		{#each reminders as item (item)}
			<li>
				<span>{HELPFUL_REMINDER_LABELS[item]}</span>
				<button type="button" class="auth-button" aria-label={`Ta bort ${HELPFUL_REMINDER_LABELS[item]}`}
					disabled={!ready || saving} onclick={() => change(item, 'remove')}>Ta bort</button>
			</li>
		{/each}
	</ul>
{/if}

{#if available.length > 0}
	<form onsubmit={(event) => {
		event.preventDefault();
		if (selected) void change(selected, 'add');
	}}>
		<label for="helpful-reminder">Något att komma ihåg</label>
		<div class="reminder-controls">
			<select id="helpful-reminder" bind:this={picker} bind:value={selected}
				disabled={!ready || saving}>
				<option value="">Välj något</option>
				{#each available as item (item)}
					<option value={item}>{HELPFUL_REMINDER_LABELS[item]}</option>
				{/each}
			</select>
			<button type="submit" class="auth-button primary" disabled={!ready || !selected || saving}>Spara</button>
		</div>
	</form>
{/if}

<p class="reminder-status" role="status">{message}</p>
{#if error}
	<p class="error-copy" role="alert">{error}</p>
{/if}

<style>
	.reminders {
		display: grid;
		gap: 0.35rem;
		margin-block: 0.8rem;
		padding-inline-start: 0;
		list-style: none;
	}

	.reminders li,
	.reminder-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	form {
		display: grid;
		gap: 0.35rem;
		margin-block-start: 0.8rem;
	}

	select {
		flex: 1 1 11rem;
		min-width: 0;
		max-width: 100%;
		min-height: 44px;
		padding: 0.45rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		color: hsl(var(--foreground));
		background: hsl(var(--background));
	}

	button {
		min-height: 44px;
	}

	.reminder-status:not(:empty) {
		margin-block-start: 0.5rem;
	}
</style>
