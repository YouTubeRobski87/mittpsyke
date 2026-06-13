<script lang="ts">
	import {
		resolveAvatarPreset,
		type AvatarPresetKey
	} from '$lib/avatar';

	type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	let {
		avatarKey = null,
		seed = null,
		size = 'md',
		label = 'Anonym profilfigur',
		decorative = false,
		animated = true,
		class: className = ''
	}: {
		avatarKey?: AvatarPresetKey | string | null;
		seed?: string | null;
		size?: AvatarSize;
		label?: string;
		decorative?: boolean;
		animated?: boolean;
		class?: string;
	} = $props();

	const preset = $derived(resolveAvatarPreset(avatarKey, seed));
	const classes = $derived(
		`user-avatar user-avatar-${size} ${animated ? 'user-avatar-animated' : ''} ${className}`.trim()
	);
</script>

<span
	class={classes}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : label}
	aria-hidden={decorative ? 'true' : undefined}
	style={`--avatar-bg: ${preset.bg}; --avatar-skin: ${preset.skin}; --avatar-hair: ${preset.hair}; --avatar-shirt: ${preset.shirt};`}
>
	<svg viewBox="0 0 96 96" focusable="false" aria-hidden="true">
		<circle class="avatar-bg" cx="48" cy="48" r="48" />

		{#if preset.hairStyle === 'long' || preset.hairStyle === 'bob' || preset.hairStyle === 'tied'}
			<path class="avatar-hair hair-back" d="M25 47c0-17 10-30 23-30s23 13 23 30v20c0 10-8 17-23 17s-23-7-23-17V47z" />
		{/if}

		<g class="avatar-breath">
			<path class="avatar-shirt" d="M17 91c3-18 16-29 31-29s28 11 31 29H17z" />
			<path class="avatar-shirt-shadow" d="M30 91c2-11 9-18 18-18s16 7 18 18H30z" />
			<rect class="avatar-skin" x="39" y="55" width="18" height="18" rx="8" />
			<circle class="avatar-ear" cx="29.5" cy="43.5" r="5.5" />
			<circle class="avatar-ear" cx="66.5" cy="43.5" r="5.5" />
			<circle class="avatar-face" cx="48" cy="42" r="21" />

			{#if preset.hairStyle === 'short'}
				<path class="avatar-hair" d="M28 39c1-15 10-23 22-23 12 0 20 8 20 23-6-8-14-12-24-12-8 0-14 4-18 12z" />
			{:else if preset.hairStyle === 'curly'}
				<path class="avatar-hair" d="M26 39c0-13 9-22 22-22 13 0 22 9 22 22-6-5-9-9-17-8-6 1-11 0-15-3-4 2-8 6-12 11z" />
				<circle class="avatar-hair" cx="34" cy="27" r="7" />
				<circle class="avatar-hair" cx="45" cy="22" r="7" />
				<circle class="avatar-hair" cx="57" cy="25" r="7" />
			{:else if preset.hairStyle === 'shaved'}
				<path class="avatar-hair hair-soft" d="M29 36c2-12 9-18 19-18s17 6 19 18c-5-4-11-6-19-6s-14 2-19 6z" />
			{:else if preset.hairStyle === 'medium'}
				<path class="avatar-hair" d="M27 42c0-16 9-25 22-25 12 0 20 9 20 25-5-8-12-12-21-12-10 0-17 4-21 12z" />
				<path class="avatar-hair" d="M27 42c-1 9 2 16 8 21-9-3-14-10-14-20 0-4 2-7 6-9v8z" />
			{:else if preset.hairStyle === 'messy'}
				<path class="avatar-hair" d="M27 39c2-13 10-22 22-22 11 0 19 8 20 22-6-5-12-8-20-8-8 0-15 3-22 8z" />
				<path class="avatar-hair" d="M36 20l-7 13 14-10 5 9 6-11 10 13-1-15H36z" />
			{:else if preset.hairStyle === 'long'}
				<path class="avatar-hair" d="M26 42c0-16 9-25 22-25 13 0 22 9 22 25-6-8-13-12-22-12s-16 4-22 12z" />
			{:else if preset.hairStyle === 'sidepart'}
				<path class="avatar-hair" d="M27 38c2-14 10-21 22-21 10 0 18 7 20 20-10-7-22-8-42 1z" />
				<path class="avatar-hair" d="M45 18c-4 8-10 13-19 17 6-13 13-18 19-17z" />
			{:else if preset.hairStyle === 'bob'}
				<path class="avatar-hair" d="M25 42c0-16 10-25 23-25 13 0 23 9 23 25-7-8-15-12-23-12s-16 4-23 12z" />
				<path class="avatar-hair" d="M26 43h9v19c-7-3-10-9-9-19zM61 43h9c1 10-2 16-9 19V43z" />
			{:else if preset.hairStyle === 'straight'}
				<path class="avatar-hair" d="M27 39c2-14 10-22 22-22s20 8 21 22c-7-5-14-8-22-8s-15 3-21 8z" />
				<path class="avatar-hair hair-soft" d="M30 31c4-6 10-9 18-9 8 0 14 3 18 9-11-2-23-2-36 0z" />
			{:else if preset.hairStyle === 'tied'}
				<path class="avatar-hair" d="M27 40c1-15 10-23 22-23s20 8 20 23c-6-7-13-10-21-10s-15 3-21 10z" />
				<circle class="avatar-hair" cx="70" cy="44" r="7" />
			{/if}

			<g class="avatar-eyes">
				<ellipse class="avatar-eye avatar-blink" cx="40.5" cy="43" rx="1.7" ry="2.2" />
				<ellipse class="avatar-eye avatar-blink" cx="55.5" cy="43" rx="1.7" ry="2.2" />
			</g>
			<path class="avatar-mouth" d="M42 52c3 2.4 9 2.4 12 0" />

			{#if preset.accessory === 'glasses'}
				<g class="avatar-glasses">
					<circle cx="40.5" cy="43" r="5.5" />
					<circle cx="55.5" cy="43" r="5.5" />
					<path d="M46 43h4" />
				</g>
			{/if}

			{#if preset.accessory === 'beard'}
				<path class="avatar-beard" d="M36 50c2 9 7 13 12 13s10-4 12-13c-4 4-8 6-12 6s-8-2-12-6z" />
				<path class="avatar-mouth beard-mouth" d="M43 54c3 2 7 2 10 0" />
			{/if}
		</g>
	</svg>
</span>

<style>
	.user-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--user-avatar-size, 2.15rem);
		height: var(--user-avatar-size, 2.15rem);
		border-radius: 9999px;
		overflow: hidden;
		flex-shrink: 0;
		background: var(--avatar-bg);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.58);
		transition: transform 180ms ease, filter 180ms ease;
	}

	.user-avatar-xs {
		--user-avatar-size: 1.45rem;
	}

	.user-avatar-sm {
		--user-avatar-size: 1.85rem;
	}

	.user-avatar-md {
		--user-avatar-size: 2.15rem;
	}

	.user-avatar-lg {
		--user-avatar-size: 2.75rem;
	}

	.user-avatar-xl {
		--user-avatar-size: 3.25rem;
	}

	.user-avatar:hover {
		transform: translateY(-1px) scale(1.025);
		filter: saturate(1.04) brightness(1.01);
	}

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.avatar-bg {
		fill: var(--avatar-bg);
	}

	.avatar-breath {
		transform-origin: 48px 55px;
	}

	.avatar-skin,
	.avatar-face,
	.avatar-ear {
		fill: var(--avatar-skin);
	}

	.avatar-ear {
		opacity: 0.92;
	}

	.avatar-hair {
		fill: var(--avatar-hair);
	}

	.hair-soft {
		opacity: 0.88;
	}

	.hair-back {
		opacity: 0.96;
	}

	.avatar-shirt {
		fill: var(--avatar-shirt);
	}

	.avatar-shirt-shadow {
		fill: rgb(255 255 255 / 0.16);
	}

	.avatar-eye {
		fill: #2d2a28;
		transform-origin: center;
	}

	.avatar-mouth,
	.beard-mouth {
		fill: none;
		stroke: #5f4338;
		stroke-width: 2.3;
		stroke-linecap: round;
	}

	.avatar-glasses {
		fill: none;
		stroke: #3f4648;
		stroke-width: 2.1;
		stroke-linecap: round;
		opacity: 0.78;
	}

	.avatar-beard {
		fill: var(--avatar-hair);
		opacity: 0.86;
	}

	.user-avatar-animated .avatar-breath {
		animation: avatar-breathe 5.8s ease-in-out infinite;
	}

	.user-avatar-animated .avatar-blink {
		animation: avatar-blink 7.5s ease-in-out infinite;
	}

	.user-avatar-animated .avatar-blink:nth-child(2) {
		animation-delay: 0.08s;
	}

	@keyframes avatar-breathe {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(0.7px) scale(1.012);
		}
	}

	@keyframes avatar-blink {
		0%,
		92%,
		100% {
			transform: scaleY(1);
		}
		94%,
		96% {
			transform: scaleY(0.08);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.user-avatar,
		.user-avatar:hover,
		.avatar-breath,
		.avatar-blink {
			animation: none !important;
			transition: none !important;
			transform: none !important;
		}
	}
</style>
