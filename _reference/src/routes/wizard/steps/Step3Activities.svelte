<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { EmojiPushpinRound, EmojiPushpin, EmojiHandWaving, EmojiHouse } from '$lib/assets/emojis';
	import RequiredIndicator from '$lib/components/RequiredIndicator.svelte';
	import { FIELD_LIMITS } from '$lib/validation';
	import { searchPlaces, getPlaceCategory, isAddress, type Place } from '$lib/utils/places';

	let locationInput = $state('');
	let activityInput = $state('');
	let personInput = $state('');

	// Place autocomplete state
	let places = $state<Place[]>([]);
	let isLoadingPlaces = $state(false);
	let showPlaceDropdown = $state(false);
	let selectedPlaceIndex = $state(-1);
	let justSelected = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;

	function triggerPlaceSearch(value: string) {
		const trimmed = value.trim();

		// Trigger place search if 2+ characters
		if (trimmed.length >= 2) {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(async () => {
				isLoadingPlaces = true;
				console.log('[Places] Searching for:', trimmed);
				const results = await searchPlaces(trimmed);
				console.log('[Places] Results:', results.length);
				places = results;
				showPlaceDropdown = results.length > 0;
				isLoadingPlaces = false;
			}, 300);
		} else {
			places = [];
			showPlaceDropdown = false;
		}

		selectedPlaceIndex = -1;
	}

	function addLocation(value: string) {
		const trimmed = value.trim();
		if (!trimmed || wizardStore.data.locations.includes(trimmed)) {
			return;
		}
		wizardStore.updateData('locations', [...wizardStore.data.locations, trimmed]);
	}

	function commitLocationInput() {
		const value = locationInput.trim();
		if (value) {
			addLocation(value);
			locationInput = '';
			places = [];
			showPlaceDropdown = false;
			selectedPlaceIndex = -1;
		}
	}

	function selectPlace(place: Place) {
		justSelected = true;
		addLocation(place.name);
		locationInput = '';
		places = [];
		showPlaceDropdown = false;
		selectedPlaceIndex = -1;
		// Reset flag after events settle
		setTimeout(() => {
			justSelected = false;
		}, 150);
	}

	function removeLocation(location: string) {
		wizardStore.updateData(
			'locations',
			wizardStore.data.locations.filter((l) => l !== location)
		);
	}

	function removeLastLocation() {
		const arr = wizardStore.data.locations;
		if (arr.length > 0) {
			wizardStore.updateData('locations', arr.slice(0, -1));
		}
	}

	function handleLocationKeydown(event: KeyboardEvent) {
		// Handle dropdown navigation
		if (showPlaceDropdown && places.length > 0) {
			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					selectedPlaceIndex = Math.min(selectedPlaceIndex + 1, places.length - 1);
					return;
				case 'ArrowUp':
					event.preventDefault();
					selectedPlaceIndex = Math.max(selectedPlaceIndex - 1, -1);
					return;
				case 'Enter':
					event.preventDefault();
					if (selectedPlaceIndex >= 0 && selectedPlaceIndex < places.length) {
						selectPlace(places[selectedPlaceIndex]);
					} else {
						commitLocationInput();
					}
					return;
				case 'Escape':
					event.preventDefault();
					showPlaceDropdown = false;
					selectedPlaceIndex = -1;
					return;
			}
		}

		// Default behavior
		if (event.key === 'Enter') {
			event.preventDefault();
			commitLocationInput();
		} else if (event.key === 'Backspace') {
			const input = event.currentTarget as HTMLInputElement;
			if (input.value === '' || (input.selectionStart === 0 && input.selectionEnd === 0)) {
				event.preventDefault();
				removeLastLocation();
			}
		}
	}

	function handleLocationBlur() {
		// Delay to allow click on dropdown items
		setTimeout(() => {
			if (locationInput.trim()) {
				commitLocationInput();
			}
			showPlaceDropdown = false;
			selectedPlaceIndex = -1;
		}, 200);
	}

	function handleLocationInputEvent(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value;

		// Handle comma-separated input
		if (value.includes(',')) {
			const parts = value.split(',');
			const beforeComma = parts[0].trim();
			const afterComma = parts.slice(1).join(',').trimStart();

			if (beforeComma) {
				addLocation(beforeComma);
			}
			locationInput = afterComma;
			places = [];
			showPlaceDropdown = false;

			// Trigger new search if there's text after comma
			if (afterComma.length >= 2) {
				triggerPlaceSearch(afterComma);
			}
		} else {
			// Normal input - trigger search
			triggerPlaceSearch(value);
		}
	}

	function addActivity() {
		const value = activityInput.trim();
		if (!value || wizardStore.data.activities.includes(value)) {
			activityInput = '';
			return;
		}
		wizardStore.updateData('activities', [...wizardStore.data.activities, value]);
		activityInput = '';
	}

	function removeActivity(activity: string) {
		wizardStore.updateData(
			'activities',
			wizardStore.data.activities.filter((a) => a !== activity)
		);
	}

	function removeLastActivity() {
		const arr = wizardStore.data.activities;
		if (arr.length > 0) {
			wizardStore.updateData('activities', arr.slice(0, -1));
		}
	}

	function addPerson() {
		const value = personInput.trim();
		if (!value || wizardStore.data.people.includes(value)) {
			personInput = '';
			return;
		}
		wizardStore.updateData('people', [...wizardStore.data.people, value]);
		personInput = '';
	}

	function removePerson(person: string) {
		wizardStore.updateData(
			'people',
			wizardStore.data.people.filter((p) => p !== person)
		);
	}

	function removeLastPerson() {
		const arr = wizardStore.data.people;
		if (arr.length > 0) {
			wizardStore.updateData('people', arr.slice(0, -1));
		}
	}

	function handleKeydown(event: KeyboardEvent, action: () => void, removeLastAction?: () => void) {
		if (event.key === 'Enter') {
			event.preventDefault();
			action();
		} else if (event.key === 'Backspace' && removeLastAction) {
			const input = event.currentTarget as HTMLInputElement;
			if (input.value === '' || (input.selectionStart === 0 && input.selectionEnd === 0)) {
				event.preventDefault();
				removeLastAction();
			}
		}
	}

	function handleCommaInput(
		event: Event,
		inputSetter: (v: string) => void,
		action: () => void
	) {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value;
		if (value.includes(',')) {
			const parts = value.split(',');
			const beforeComma = parts[0];
			const afterComma = parts.slice(1).join(',').trimStart();

			input.value = beforeComma;
			inputSetter(beforeComma);
			action();

			input.value = afterComma;
			inputSetter(afterComma);
		}
	}

	function focusInput(event: MouseEvent) {
		const container = event.currentTarget as HTMLElement;
		const input = container.querySelector('input');
		if (input) input.focus();
	}
</script>

<div class="step-content">
	<p class="step-intro">Var utspelade sig dagen? Vad hände? Vilka var med? Fyll i det du minns – stora som små detaljer.</p>

	<div class="field-group">
		<span class="field-label">
			<span class="label-emoji"><EmojiHouse size={23} /></span>
			<span>Var har du varit idag?<RequiredIndicator tooltip="Lägg till minst en plats" /></span>
		</span>

		<div class="autocomplete-wrapper">
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
				{#each wizardStore.data.locations as location}
					<span class="tag">
						{location}
						<button class="tag-remove" onclick={() => removeLocation(location)}>×</button>
					</span>
				{/each}
				<input
					type="text"
					placeholder={wizardStore.data.locations.length === 0 ? 'Sök efter platser, eller skriv fritt...' : ''}
					bind:value={locationInput}
					onkeydown={handleLocationKeydown}
					oninput={handleLocationInputEvent}
					onblur={handleLocationBlur}
					onfocus={() => { if (places.length > 0 && !justSelected) showPlaceDropdown = true; }}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
					maxlength={FIELD_LIMITS.locations}
				/>
				{#if isLoadingPlaces}
					<span class="loading-indicator"></span>
				{/if}
			</div>

			{#if showPlaceDropdown && places.length > 0}
				<ul class="dropdown" role="listbox">
					{#each places as place, i}
						<li
							class="dropdown-item"
							class:selected={i === selectedPlaceIndex}
							role="option"
							aria-selected={i === selectedPlaceIndex}
							onmousedown={(e) => { e.preventDefault(); selectPlace(place); }}
							onmouseenter={() => (selectedPlaceIndex = i)}
						>
							<span class="place-icon">
								{#if isAddress(place.types)}
									<EmojiPushpinRound size={22} />
								{:else}
									<EmojiPushpinRound size={22} />
								{/if}
							</span>
							<span class="place-info">
								<span class="place-name">{place.name}</span>
								{#if place.address}
									<span class="place-address">{place.address}</span>
								{/if}
							</span>
							{#if getPlaceCategory(place.types)}
								<span class="place-category">{getPlaceCategory(place.types)}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<div class="field-group">
		<span class="field-label">
			<span class="label-emoji"><EmojiPushpin size={23} /></span>
			<span>Vad hände idag?<RequiredIndicator tooltip="Lägg till minst en händelse" /></span>
		</span>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
			{#each wizardStore.data.activities as activity}
				<span class="tag">
					{activity}
					<button class="tag-remove" onclick={() => removeActivity(activity)}>×</button>
				</span>
			{/each}
			<input
				type="text"
				placeholder={wizardStore.data.activities.length === 0 ? 'Stirrade på ett dokument, åt lunch i solen...' : ''}
				bind:value={activityInput}
				onkeydown={(e) => handleKeydown(e, addActivity, removeLastActivity)}
				oninput={(e) => handleCommaInput(e, (v) => activityInput = v, addActivity)}
				onblur={addActivity}
				maxlength={FIELD_LIMITS.activities}
			/>
		</div>
	</div>

	<div class="field-group">
		<span class="field-label">
			<span class="label-emoji"><EmojiHandWaving size={23} /></span>
			Vilka var med idag?
		</span>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
			{#each wizardStore.data.people as person}
				<span class="tag">
					{person}
					<button class="tag-remove" onclick={() => removePerson(person)}>×</button>
				</span>
			{/each}
			<input
				type="text"
				placeholder={wizardStore.data.people.length === 0 ? 'Träffade du någon? Var du ens själv med?' : ''}
				bind:value={personInput}
				onkeydown={(e) => handleKeydown(e, addPerson, removeLastPerson)}
				oninput={(e) => handleCommaInput(e, (v) => personInput = v, addPerson)}
				onblur={addPerson}
				maxlength={FIELD_LIMITS.people}
			/>
		</div>
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.step-intro {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		margin-top: 0;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
	}

	.label-emoji {
		display: flex;
		align-items: center;
	}

	.label-emoji :global(svg) {
		width: 23px !important;
		height: 23px !important;
	}

	.autocomplete-wrapper {
		position: relative;
	}

	.tag-input {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.75rem;
		padding: 0.375rem 0.625rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-elevated);
		cursor: text;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.tag-input:focus-within {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.tag-input input {
		flex: 1;
		min-width: 80px;
		height: 1.75rem;
		padding: 0 0.25rem;
		border: none;
		background: transparent;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-text);
	}

	.tag-input input:focus {
		border: none;
		outline: none;
		box-shadow: none;
	}

	.tag-input input::placeholder {
		color: var(--color-text-muted);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wider);
		opacity: 0.6;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: 0.12rem 0.5rem;
		background-color: var(--color-accent);
		border-radius: 0.325rem;
		color: white;
		white-space: nowrap;
	}

	.tag-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 0.875rem;
		height: 0.875rem;
		font-size: 0.875rem;
		line-height: 1;
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		opacity: 0.8;
		transition: opacity 0.15s ease;
	}

	.tag-remove:hover {
		opacity: 1;
	}

	.loading-indicator {
		width: 14px;
		height: 14px;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		max-height: 200px;
		overflow-y: auto;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		list-style: none;
		margin: 0;
		padding: 0.25rem 0;
		z-index: 100;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		transition: background-color 0.1s ease;
	}

	.dropdown-item:hover,
	.dropdown-item.selected {
		background-color: var(--color-neutral);
	}

	.place-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		opacity: 0.6;
	}

	.place-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}

	.place-name {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.place-address {
		font-size: var(--text-xs);
		font-weight: var(--weight-regular);
		color: var(--color-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.place-category {
		flex-shrink: 0;
		font-size: 0.625rem;
		font-weight: var(--weight-medium);
		color: var(--color-accent);
		background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
		padding: 0.0625rem 0.375rem;
		border-radius: 0.1875rem;
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
	}

	@media (max-width: 600px) {
		.place-category {
			display: none;
		}
	}

	@media (max-width: 480px) {
		.tag-input {
			padding: 0.375rem 0.5rem;
		}
	}

	@media (max-width: 400px) {
		.tag-input input {
			min-width: 60px;
		}
	}

	@media (max-width: 320px) {
		.tag-input input {
			min-width: 40px;
		}
	}
</style>
