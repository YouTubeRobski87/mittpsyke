<script lang="ts">
	// Övergången från anonym lokalhistorik till konto. Visas bara för en
	// inloggad användare som har lokala inlägg kvar i den här webbläsaren.
	//
	// Inget flyttas automatiskt: användaren kryssar själv för vilka inlägg som
	// ska sparas. Import sker som vanliga dagboksinlägg via /api/diary/create -
	// samma endpoint som den inloggade dagboken redan använder - utan någon
	// AI-reflektion, analys eller innehåll till analytics. Bara de inlägg som
	// faktiskt sparades tas bort lokalt; resten ligger kvar orörda tills
	// användaren väljer dem, så flödet går att köra om utan dubbletter.
	import { onMount } from 'svelte';
	import type { Session } from '@supabase/supabase-js';
	import { supabase } from '$lib/supabase';
	import {
		deleteLocalEntry,
		formatLocalEntryDate,
		localEntryPreview,
		readLocalEntries,
		type LocalDiaryEntry
	} from '$lib/diary-local-history';
	import { buildLocalImportRequestBody, partitionLocalEntriesForImport } from '$lib/diary-local-import';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import ConsentGate from '$lib/components/ConsentGate.svelte';

	let ready = $state(false);
	let entries = $state<LocalDiaryEntry[]>([]);
	let selected = $state<Set<string>>(new Set());
	let dismissed = $state(false);
	let hasConsent = $state(false);
	let importing = $state(false);
	let resultMessage = $state('');
	let errorMessage = $state('');

	const selectedCount = $derived(selected.size);

	onMount(async () => {
		entries = readLocalEntries();
		if (entries.length === 0) {
			ready = true;
			return;
		}

		const { data } = await supabase.auth.getSession();
		hasConsent = hasSensitiveConsent(data.session?.user.user_metadata);
		ready = true;
	});

	function toggle(id: string) {
		const next = new Set(selected);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selected = next;
	}

	async function acceptConsent() {
		const consent = grantSensitiveConsent();
		hasConsent = true;

		try {
			const { error } = await supabase.auth.updateUser({
				data: { health_data_processing_consent: consent }
			});
			if (!error) await supabase.auth.refreshSession();
		} catch {
			// Samtycket gäller ändå lokalt i den här webbläsaren.
		}
	}

	async function importSelected() {
		if (importing || selectedCount === 0) return;
		importing = true;
		errorMessage = '';
		resultMessage = '';

		const { data } = await supabase.auth.getSession();
		const session: Session | null = data.session;
		if (!session?.access_token) {
			errorMessage = 'Logga in för att spara till kontot.';
			importing = false;
			return;
		}

		const { toImport } = partitionLocalEntriesForImport(entries, selected);
		let importedCount = 0;

		for (const item of toImport) {
			try {
				const response = await fetch('/api/diary/create', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
						Authorization: `Bearer ${session.access_token}`
					},
					body: JSON.stringify(buildLocalImportRequestBody(item))
				});
				const result: { success?: boolean } | null = await response.json().catch(() => null);

				if (response.ok && result?.success) {
					// Bara det som faktiskt sparades i kontot tas bort lokalt. Övriga
					// inlägg - avvalda eller misslyckade - ligger kvar orörda.
					deleteLocalEntry(item.id);
					importedCount += 1;
					const next = new Set(selected);
					next.delete(item.id);
					selected = next;
				}
			} catch {
				// Nätverksfel: inlägget lämnas kvar lokalt så det går att försöka igen.
			}
		}

		entries = readLocalEntries();
		importing = false;
		resultMessage =
			importedCount > 0
				? `${importedCount} ${importedCount === 1 ? 'inlägg sparat' : 'inlägg sparade'} till ditt konto.`
				: 'Inget inlägg kunde sparas just nu. Försök igen.';
	}

	function dismiss() {
		dismissed = true;
	}
</script>

{#if ready && !dismissed && entries.length > 0}
	<section class="local-import" aria-labelledby="local-import-heading">
		<h2 id="local-import-heading">Du har lokala inlägg på den här enheten</h2>
		<p class="local-import-note">
			De här inläggen har hittills bara funnits i den här webbläsaren. De sparas till ditt konto
			först när du väljer det här - vill du spara några av dem?
		</p>

		{#if !hasConsent}
			<ConsentGate
				title="Innan du sparar till kontot"
				dataLabel="Lokala inlägg du väljer att spara till kontot"
				serviceLabel="MittPsyke för lagring i din dagbok"
				onAccept={acceptConsent}
			/>
		{:else}
			<ul class="local-import-list">
				{#each entries as item (item.id)}
					<li>
						<label class="local-import-item">
							<input
								type="checkbox"
								checked={selected.has(item.id)}
								onchange={() => toggle(item.id)}
							/>
							<span class="local-import-body">
								<span class="local-import-date">{formatLocalEntryDate(item.updatedAt)}</span>
								<span class="local-import-preview">{localEntryPreview(item.text)}</span>
							</span>
						</label>
					</li>
				{/each}
			</ul>

			{#if resultMessage}
				<p class="local-import-result" role="status" aria-live="polite">{resultMessage}</p>
			{/if}
			{#if errorMessage}
				<p class="local-import-error" role="alert">{errorMessage}</p>
			{/if}

			<div class="local-import-actions">
				<button
					type="button"
					class="local-import-primary"
					onclick={importSelected}
					disabled={importing || selectedCount === 0}
				>
					{importing ? 'Sparar...' : `Spara valda (${selectedCount})`}
				</button>
				<button type="button" class="local-import-secondary" onclick={dismiss}>Inte nu</button>
			</div>
		{/if}
	</section>
{/if}

<style>
	.local-import {
		max-width: 1080px;
		margin: 0 auto 1.25rem;
		padding: clamp(1rem, 3vw, 1.4rem);
		display: grid;
		gap: 0.75rem;
		border-radius: 24px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
	}

	.local-import h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.1rem;
		letter-spacing: -0.02em;
	}

	.local-import-note {
		margin: 0;
		max-width: 62ch;
		color: hsl(var(--muted-foreground));
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.local-import-list {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.local-import-item {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input, 0.75rem);
		background: hsl(var(--surface-soft));
		cursor: pointer;
	}

	.local-import-item input {
		margin-top: 0.2rem;
		flex-shrink: 0;
	}

	.local-import-body {
		display: grid;
		gap: 0.2rem;
	}

	.local-import-date {
		color: hsl(var(--muted-foreground));
		font-size: 0.78rem;
	}

	.local-import-preview {
		font-size: 0.92rem;
		line-height: 1.5;
		overflow-wrap: anywhere;
	}

	.local-import-result,
	.local-import-error {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.5;
	}

	.local-import-error {
		color: hsl(var(--error-foreground));
	}

	.local-import-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.local-import-primary,
	.local-import-secondary {
		min-height: 44px;
		padding: 0.5rem 1.1rem;
		border-radius: var(--radius-pill);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.local-import-primary {
		border: 1px solid var(--primary);
		background: var(--primary);
		color: #fff;
	}

	.local-import-primary:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.local-import-secondary {
		border: 1px solid hsl(var(--foreground) / 0.32);
		background: hsl(var(--surface-soft));
		color: hsl(var(--foreground));
	}
</style>
