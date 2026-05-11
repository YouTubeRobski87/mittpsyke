export const ageRangeOptions = [
	{ value: 'under_18', label: 'Under 18' },
	{ value: '18_25', label: '18-25' },
	{ value: '26_35', label: '26-35' },
	{ value: '36_50', label: '36-50' },
	{ value: '51_plus', label: '51+' }
] as const;

export const genderOptions = [
	{ value: 'kvinna', label: 'Kvinna' },
	{ value: 'man', label: 'Man' },
	{ value: 'ickebinar', label: 'Ickebinär' },
	{ value: 'vill_ej_ange', label: 'Vill ej ange' }
] as const;

export type AgeRange = (typeof ageRangeOptions)[number]['value'];
export type Gender = (typeof genderOptions)[number]['value'];

export function getAgeRangeLabel(value: string | null | undefined) {
	return ageRangeOptions.find((option) => option.value === value)?.label ?? null;
}

export function getGenderLabel(value: string | null | undefined) {
	return genderOptions.find((option) => option.value === value)?.label ?? null;
}

export function isAgeRange(value: string): value is AgeRange {
	return ageRangeOptions.some((option) => option.value === value);
}

export function isGender(value: string): value is Gender {
	return genderOptions.some((option) => option.value === value);
}
