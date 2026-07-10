<script lang="ts">
	import { resolveAvatarPreset, type AvatarPresetKey } from '$lib/avatar';

	type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	let {
		avatarKey = null,
		seed = null,
		name = '',
		size = 'md',
		label = 'Profilbild',
		decorative = false,
		animated = false,
		class: className = ''
	}: {
		avatarKey?: AvatarPresetKey | string | null;
		seed?: string | null;
		name?: string | null;
		size?: AvatarSize;
		label?: string;
		decorative?: boolean;
		animated?: boolean;
		class?: string;
	} = $props();

	function getInitial(source: string | null | undefined, fallback: string): string {
		const cleaned = typeof source === 'string' ? source.trim() : '';
		const match = cleaned.match(/\p{L}|\p{N}/u);
		if (match) return match[0].toLocaleUpperCase('sv-SE');

		const fallbackMatch = fallback.trim().match(/\p{L}|\p{N}/u);
		return (fallbackMatch?.[0] ?? 'M').toLocaleUpperCase('sv-SE');
	}

	function getForegroundColor(background: string): string {
		const normalized = background.trim().replace('#', '');
		if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '#243726';

		const red = Number.parseInt(normalized.slice(0, 2), 16);
		const green = Number.parseInt(normalized.slice(2, 4), 16);
		const blue = Number.parseInt(normalized.slice(4, 6), 16);
		const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

		return brightness > 162 ? '#243726' : '#f8f5ef';
	}

	const preset = $derived(resolveAvatarPreset(avatarKey, seed ?? name ?? label));
	const initial = $derived(getInitial(name, label));
	const foreground = $derived(getForegroundColor(preset.bg));
	const classes = $derived(
		`user-avatar user-avatar-${size} ${animated ? 'user-avatar-animated' : ''} ${className}`.trim()
	);
</script>

<span
	class={classes}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : label}
	aria-hidden={decorative ? 'true' : undefined}
	style={`--avatar-bg: ${preset.bg}; --avatar-fg: ${foreground};`}
>
	<span class="avatar-initial" aria-hidden="true">{initial}</span>
</span>

<style>
	.user-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--user-avatar-size, 2.15rem);
		height: var(--user-avatar-size, 2.15rem);
		border-radius: 9999px;
		flex-shrink: 0;
		background: var(--avatar-bg);
		color: var(--avatar-fg);
		border: 1px solid rgba(36, 55, 38, 0.08);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.42),
			0 1px 2px rgba(31, 47, 34, 0.06);
		font-family: var(--font-heading, inherit);
		font-weight: 700;
		line-height: 1;
		text-transform: uppercase;
		user-select: none;
	}

	.user-avatar-xs {
		--user-avatar-size: 1.45rem;
		--user-avatar-font-size: 0.7rem;
	}

	.user-avatar-sm {
		--user-avatar-size: 1.85rem;
		--user-avatar-font-size: 0.82rem;
	}

	.user-avatar-md {
		--user-avatar-size: 2.15rem;
		--user-avatar-font-size: 0.92rem;
	}

	.user-avatar-lg {
		--user-avatar-size: 2.75rem;
		--user-avatar-font-size: 1.08rem;
	}

	.user-avatar-xl {
		--user-avatar-size: 3.25rem;
		--user-avatar-font-size: 1.24rem;
	}

	.avatar-initial {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: var(--user-avatar-font-size, 0.92rem);
		letter-spacing: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.user-avatar {
			transition: none !important;
		}
	}
</style>
