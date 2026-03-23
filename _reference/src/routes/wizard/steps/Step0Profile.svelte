<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { FIELD_LIMITS } from '$lib/validation';
	const pronounOptions = [
		{ value: 'hon', label: 'Hon / Henne' },
		{ value: 'han', label: 'Han / Honom' },
		{ value: 'hen', label: 'Hen / Henom' },
		{ value: 'none', label: 'Vill inte uppge' }
	];

	let familyInput = $state('');
	let occupationInput = $state('');
	let petInput = $state('');
	let interestInput = $state('');

	function addFamily() {
		const value = familyInput.trim();
		if (!value || wizardStore.data.profile.family.includes(value)) {
			familyInput = '';
			return;
		}
		wizardStore.updateProfile('family', [...wizardStore.data.profile.family, value]);
		familyInput = '';
	}

	function removeFamily(member: string) {
		wizardStore.updateProfile(
			'family',
			wizardStore.data.profile.family.filter((f) => f !== member)
		);
	}

	function removeLastFamily() {
		const arr = wizardStore.data.profile.family;
		if (arr.length > 0) {
			wizardStore.updateProfile('family', arr.slice(0, -1));
		}
	}

	function addOccupation() {
		const value = occupationInput.trim();
		if (!value || wizardStore.data.profile.occupationDetail.includes(value)) {
			occupationInput = '';
			return;
		}
		wizardStore.updateProfile('occupationDetail', [
			...wizardStore.data.profile.occupationDetail,
			value
		]);
		occupationInput = '';
	}

	function removeOccupation(occupation: string) {
		wizardStore.updateProfile(
			'occupationDetail',
			wizardStore.data.profile.occupationDetail.filter((o) => o !== occupation)
		);
	}

	function removeLastOccupation() {
		const arr = wizardStore.data.profile.occupationDetail;
		if (arr.length > 0) {
			wizardStore.updateProfile('occupationDetail', arr.slice(0, -1));
		}
	}

	function addPet() {
		const value = petInput.trim();
		if (!value || wizardStore.data.profile.pets.includes(value)) {
			petInput = '';
			return;
		}
		wizardStore.updateProfile('pets', [...wizardStore.data.profile.pets, value]);
		petInput = '';
	}

	function removePet(pet: string) {
		wizardStore.updateProfile(
			'pets',
			wizardStore.data.profile.pets.filter((p) => p !== pet)
		);
	}

	function removeLastPet() {
		const arr = wizardStore.data.profile.pets;
		if (arr.length > 0) {
			wizardStore.updateProfile('pets', arr.slice(0, -1));
		}
	}

	function addInterest() {
		const value = interestInput.trim();
		if (!value || wizardStore.data.profile.interests.includes(value)) {
			interestInput = '';
			return;
		}
		wizardStore.updateProfile('interests', [...wizardStore.data.profile.interests, value]);
		interestInput = '';
	}

	function removeInterest(interest: string) {
		wizardStore.updateProfile(
			'interests',
			wizardStore.data.profile.interests.filter((i) => i !== interest)
		);
	}

	function removeLastInterest() {
		const arr = wizardStore.data.profile.interests;
		if (arr.length > 0) {
			wizardStore.updateProfile('interests', arr.slice(0, -1));
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

			// Must set input.value directly so Svelte's bind:value reads the correct value
			input.value = beforeComma;
			inputSetter(beforeComma);
			action();

			input.value = afterComma;
			inputSetter(afterComma);
		}
	}

	function handleTextInput(key: 'name' | 'hometown', value: string) {
		wizardStore.updateProfile(key, value);
	}

	// Swedish month names
	const swedishMonths = [
		{ value: 1, label: 'Januari' },
		{ value: 2, label: 'Februari' },
		{ value: 3, label: 'Mars' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'Maj' },
		{ value: 6, label: 'Juni' },
		{ value: 7, label: 'Juli' },
		{ value: 8, label: 'Augusti' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'Oktober' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'December' }
	];

	// Parse existing birthday or initialize empty
	function parseBirthday(dateStr: string | null) {
		if (!dateStr) return { year: '', month: '', day: '' };
		const [year, month, day] = dateStr.split('-');
		return {
			year: year || '',
			month: month ? parseInt(month, 10).toString() : '',
			day: day ? parseInt(day, 10).toString() : ''
		};
	}

	let birthdayParts = $state(parseBirthday(wizardStore.data.profile.birthday));

	// Generate year options (1900 to 2025)
	const currentYear = new Date().getFullYear();
	const yearOptions = Array.from({ length: 126 }, (_, i) => 2025 - i);

	// Days in month calculation
	function getDaysInMonth(year: number, month: number): number {
		if (!year || !month) return 31;
		return new Date(year, month, 0).getDate();
	}

	let daysInSelectedMonth = $derived(
		getDaysInMonth(
			birthdayParts.year ? parseInt(birthdayParts.year, 10) : currentYear,
			birthdayParts.month ? parseInt(birthdayParts.month, 10) : 1
		)
	);

	function updateBirthday() {
		const { year, month, day } = birthdayParts;
		if (year && month && day) {
			const paddedMonth = month.padStart(2, '0');
			const paddedDay = day.padStart(2, '0');
			wizardStore.updateProfile('birthday', `${year}-${paddedMonth}-${paddedDay}`);
		} else {
			wizardStore.updateProfile('birthday', null);
		}
	}

	function handleBirthdayPartChange(part: 'year' | 'month' | 'day', value: string) {
		birthdayParts[part] = value;
		// Adjust day if it exceeds days in the new month
		if (part === 'month' || part === 'year') {
			const maxDay = getDaysInMonth(
				parseInt(birthdayParts.year, 10) || currentYear,
				parseInt(birthdayParts.month, 10) || 1
			);
			if (birthdayParts.day && parseInt(birthdayParts.day, 10) > maxDay) {
				birthdayParts.day = maxDay.toString();
			}
		}
		updateBirthday();
	}

	function focusInput(event: MouseEvent) {
		const container = event.currentTarget as HTMLElement;
		const input = container.querySelector('input');
		if (input) input.focus();
	}
</script>

<div class="step-content">
	<p class="step-intro">
		Fyll i det du vill – lite eller mycket, det är upp till dig. Hoppa över sådant som inte känns relevant.
	</p>

	<div class="form-grid">
		<div class="field-group">
			<label class="field-label" for="name">Tilltalsnamn</label>
			<input
				id="name"
				type="text"
				placeholder="Vad du heter eller vill bli kallad..."
				value={wizardStore.data.profile.name}
				oninput={(e) => handleTextInput('name', e.currentTarget.value)}
				maxlength={FIELD_LIMITS.name}
			/>
		</div>

		<div class="field-row birthday-row">
			<div class="field-group birthday-group">
				<span class="field-label" id="birthday-label">Födelsedag</span>
				<div class="birthday-selects" role="group" aria-labelledby="birthday-label">
					<select
						id="birthday-day"
						class="birthday-day"
						aria-label="Dag"
						value={birthdayParts.day}
						onchange={(e) => handleBirthdayPartChange('day', e.currentTarget.value)}
					>
						<option value="" disabled selected={birthdayParts.day === ''}>Dag</option>
						{#each Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1) as day}
							<option value={day.toString()}>{day}</option>
						{/each}
					</select>
					<select
						id="birthday-month"
						class="birthday-month"
						aria-label="Månad"
						value={birthdayParts.month}
						onchange={(e) => handleBirthdayPartChange('month', e.currentTarget.value)}
					>
						<option value="" disabled selected={birthdayParts.month === ''}>Månad</option>
						{#each swedishMonths as month}
							<option value={month.value.toString()}>{month.label}</option>
						{/each}
					</select>
					<select
						id="birthday-year"
						class="birthday-year"
						aria-label="År"
						value={birthdayParts.year}
						onchange={(e) => handleBirthdayPartChange('year', e.currentTarget.value)}
					>
						<option value="" disabled selected={birthdayParts.year === ''}>År</option>
						{#each yearOptions as year}
							<option value={year.toString()}>{year}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="field-group compact">
				<label class="field-label" for="pronouns">Pronomen</label>
				<select
					id="pronouns"
					value={wizardStore.data.profile.pronouns}
					onchange={(e) => wizardStore.updateProfile('pronouns', e.currentTarget.value)}
				>
					<option value="" disabled selected={wizardStore.data.profile.pronouns === ''}
						>-- Välj pronomen --</option
					>
					{#each pronounOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="field-group">
			<label class="field-label" for="hometown">Hemstad / ort</label>
			<input
				id="hometown"
				type="text"
				placeholder="Lägenhet i Göteborg, hus på landsbygden..."
				value={wizardStore.data.profile.hometown}
				oninput={(e) => handleTextInput('hometown', e.currentTarget.value)}
				maxlength={FIELD_LIMITS.hometown}
			/>
		</div>

		<div class="field-group">
			<label class="field-label" for="occupation">Sysselsättning</label>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
				{#each wizardStore.data.profile.occupationDetail as occupation}
					<span class="tag">
						{occupation}
						<button class="tag-remove" onclick={() => removeOccupation(occupation)}>×</button>
					</span>
				{/each}
				<input
					id="occupation"
					type="text"
					placeholder={wizardStore.data.profile.occupationDetail.length === 0 ? 'Jobbar, pluggar, pensionär, lite av varje...' : ''}
					bind:value={occupationInput}
					onkeydown={(e) => handleKeydown(e, addOccupation, removeLastOccupation)}
					oninput={(e) => handleCommaInput(e, (v) => occupationInput = v, addOccupation)}
					onblur={addOccupation}
					maxlength={FIELD_LIMITS.occupationDetail}
				/>
			</div>
		</div>

		<div class="field-row">
			<div class="field-group compact">
				<label class="field-label" for="family">Familjemedlemmar</label>
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
					{#each wizardStore.data.profile.family as member}
						<span class="tag">
							{member}
							<button class="tag-remove" onclick={() => removeFamily(member)}>×</button>
						</span>
					{/each}
					<input
						id="family"
						type="text"
						placeholder={wizardStore.data.profile.family.length === 0 ? 'Sambon, mormor som alltid ringer...' : ''}
						bind:value={familyInput}
						onkeydown={(e) => handleKeydown(e, addFamily, removeLastFamily)}
						oninput={(e) => handleCommaInput(e, (v) => familyInput = v, addFamily)}
						onblur={addFamily}
						maxlength={FIELD_LIMITS.family}
					/>
				</div>
			</div>

			<div class="field-group compact">
				<label class="field-label" for="pets">Husdjur</label>
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
					{#each wizardStore.data.profile.pets as pet}
						<span class="tag">
							{pet}
							<button class="tag-remove" onclick={() => removePet(pet)}>×</button>
						</span>
					{/each}
					<input
						id="pets"
						type="text"
						placeholder={wizardStore.data.profile.pets.length === 0 ? 'Katten Mats, fågeln Pelle...' : ''}
						bind:value={petInput}
						onkeydown={(e) => handleKeydown(e, addPet, removeLastPet)}
						oninput={(e) => handleCommaInput(e, (v) => petInput = v, addPet)}
						onblur={addPet}
						maxlength={FIELD_LIMITS.pets}
					/>
				</div>
			</div>
		</div>

		<div class="field-group">
			<label class="field-label" for="interests">Intressen & hobbies</label>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
				{#each wizardStore.data.profile.interests as interest}
					<span class="tag">
						{interest}
						<button class="tag-remove" onclick={() => removeInterest(interest)}>×</button>
					</span>
				{/each}
				<input
					id="interests"
					type="text"
					placeholder={wizardStore.data.profile.interests.length === 0 ? 'Träning, WoW, TikTok, bygga appar...' : ''}
					bind:value={interestInput}
					onkeydown={(e) => handleKeydown(e, addInterest, removeLastInterest)}
					oninput={(e) => handleCommaInput(e, (v) => interestInput = v, addInterest)}
					onblur={addInterest}
					maxlength={FIELD_LIMITS.interests}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
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

	.form-grid {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.field-row {
		display: flex;
		gap: 0.75rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field-group.compact {
		flex: 1;
		min-width: 0;
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	input[type='text'] {
		width: 100%;
		height: 2.75rem;
		padding: 0 0.875rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-normal);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-elevated);
		color: var(--color-text);
		outline: none;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
		box-sizing: border-box;
	}

	input[type='text']:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	input[type='text']::placeholder {
		color: var(--color-text-muted);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wider);
		opacity: 0.7;
	}

	.birthday-row {
		flex-wrap: wrap;
	}

	.birthday-group {
		flex: 2;
		min-width: 0;
	}

	.birthday-selects {
		display: flex;
		gap: 0.5rem;
	}

	.birthday-day,
	.birthday-month,
	.birthday-year {
		width: auto;
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235f5f5f' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.5rem center;
		padding-right: 1.75rem;
	}

	.birthday-day {
		flex: 0 0 4.5rem;
	}

	.birthday-month {
		flex: 1;
		min-width: 6rem;
	}

	.birthday-year {
		flex: 0 0 5rem;
	}

	select {
		width: 100%;
		height: 2.75rem;
		padding: 0 0.875rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-normal);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-elevated);
		color: var(--color-text);
		outline: none;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
		box-sizing: border-box;
	}

	select:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
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
		min-width: 60px;
		height: 1.75rem;
		padding: 0 0.25rem;
		border: none;
		background: transparent;
		font-size: var(--text-sm);
	}

	.tag-input input:focus {
		border: none;
		outline: none;
		box-shadow: none;
	}

	.tag-input input::placeholder {
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

	@media (max-width: 600px) {
		.field-row {
			flex-direction: column;
		}

		.birthday-row {
			flex-direction: column;
		}

		.birthday-selects {
			flex-wrap: wrap;
		}

		.birthday-day {
			flex: 0 0 4rem;
		}

		.birthday-month {
			flex: 1;
			min-width: 5.5rem;
		}

		.birthday-year {
			flex: 0 0 4.5rem;
		}
	}

	@media (max-width: 480px) {
		input[type='text'] {
			padding: 0 0.625rem;
		}

		select {
			padding: 0 0.625rem;
		}

		.tag-input {
			padding: 0.375rem 0.5rem;
		}
	}

	@media (max-width: 360px) {
		.birthday-selects {
			gap: 0.375rem;
		}

		.birthday-day {
			flex: 1 1 3rem;
			min-width: 0;
		}

		.birthday-month {
			flex: 2 1 4rem;
			min-width: 0;
		}

		.birthday-year {
			flex: 1 1 3.5rem;
			min-width: 0;
		}

		.tag-input input {
			min-width: 40px;
		}
	}
</style>
