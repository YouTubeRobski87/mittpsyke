<script lang="ts">
	import { processAvatarImage } from '$lib/utils/imageResize';
	import { accentStore } from '$lib/stores/accent.svelte';
	import {
		EmojiUserSilhouettePink,
		EmojiUserSilhouetteAmber,
		EmojiUserSilhouetteBlue,
		EmojiUserSilhouetteLime,
		EmojiUserSilhouetteRed
	} from '$lib/assets/emojis';

	const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
	const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

	interface Props {
		avatarUrl: string | null;
		name: string;
		size?: number;
		editable?: boolean;
		uploading?: boolean;
		onUpload?: (file: File) => void;
	}

	let {
		avatarUrl,
		name,
		size = 120,
		editable = false,
		uploading = false,
		onUpload
	}: Props = $props();

	const silhouetteComponents = {
		pink: EmojiUserSilhouettePink,
		amber: EmojiUserSilhouetteAmber,
		blue: EmojiUserSilhouetteBlue,
		lime: EmojiUserSilhouetteLime,
		red: EmojiUserSilhouetteRed
	};

	let SilhouetteIcon = $derived(silhouetteComponents[accentStore.current]);

	let fileInput = $state<HTMLInputElement>();
	let error = $state('');

	function handleClick() {
		if (editable && !uploading) {
			fileInput?.click();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	async function handleFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		error = '';

		if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
			error = 'Ogiltigt filformat. Använd JPG, PNG eller WebP.';
			input.value = '';
			return;
		}

		if (file.size > AVATAR_MAX_SIZE) {
			error = 'Bilden är för stor. Maximal storlek är 5 MB.';
			input.value = '';
			return;
		}

		try {
			const processed = await processAvatarImage(file);
			onUpload?.(processed);
		} catch {
			error = 'Kunde inte bearbeta bilden. Försök med en annan bild.';
		}

		input.value = '';
	}
</script>

<div class="avatar-wrapper" style:--avatar-size="{size}px">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="avatar"
		class:editable
		class:uploading
		onclick={editable ? handleClick : undefined}
		onkeydown={editable ? handleKeydown : undefined}
		tabindex={editable ? 0 : -1}
		role={editable ? 'button' : 'img'}
		aria-label={editable ? 'Ändra profilbild' : `Profilbild för ${name || 'användare'}`}
	>
		{#if avatarUrl}
			<img src={avatarUrl} alt="Profilbild" class="avatar-img" />
		{:else}
			<div class="avatar-default-emoji">
				<SilhouetteIcon />
			</div>
		{/if}

		{#if editable}
			<div class="avatar-overlay">
				{#if uploading}
					<div class="avatar-spinner"></div>
				{/if}
			</div>
		{/if}
	</div>

	{#if editable}
		<input
			bind:this={fileInput}
			type="file"
			accept="image/jpeg,image/png,image/webp"
			onchange={handleFileChange}
			class="avatar-file-input"
			aria-hidden="true"
			tabindex={-1}
		/>
	{/if}


	{#if error}
		<p class="avatar-error">{error}</p>
	{/if}
</div>

<style>
	.avatar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.avatar {
		position: relative;
		width: var(--avatar-size);
		height: var(--avatar-size);
		border-radius: 50%;
		overflow: hidden;
		padding: 4px;
		background-color: var(--color-bg-elevated);
		border: 3px solid var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent), 0 2px 8px rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}

	.avatar.editable {
		cursor: pointer;
	}

	.avatar.editable:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		border-radius: 50%;
	}

	.avatar-default-emoji {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		overflow: hidden;
	}

	.avatar-default-emoji :global(svg) {
		width: 92%;
		height: 92%;
		transform: translateY(5%);
	}

	.avatar-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}

	.avatar.uploading .avatar-overlay {
		background: rgba(0, 0, 0, 0.45);
		opacity: 1;
	}

	.avatar-spinner {
		width: 24px;
		height: 24px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.avatar-file-input {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
		opacity: 0;
	}

.avatar-error {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		color: var(--color-accent);
		text-align: center;
		margin: 0;
		max-width: 200px;
	}
</style>
