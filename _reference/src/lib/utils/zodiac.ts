export interface ZodiacSign {
	id: string;
	name: string; // Swedish: 'Väduren', 'Oxen', etc.
	symbol: string; // Unicode symbol
	dateRange: string; // Swedish date range
}

export const zodiacSigns: ZodiacSign[] = [
	{ id: 'capricorn', name: 'Stenbocken', symbol: '♑', dateRange: '22 dec - 19 jan' },
	{ id: 'aquarius', name: 'Vattumannen', symbol: '♒', dateRange: '20 jan - 18 feb' },
	{ id: 'pisces', name: 'Fiskarna', symbol: '♓', dateRange: '19 feb - 20 mar' },
	{ id: 'aries', name: 'Väduren', symbol: '♈', dateRange: '21 mar - 19 apr' },
	{ id: 'taurus', name: 'Oxen', symbol: '♉', dateRange: '20 apr - 20 maj' },
	{ id: 'gemini', name: 'Tvillingarna', symbol: '♊', dateRange: '21 maj - 20 jun' },
	{ id: 'cancer', name: 'Kräftan', symbol: '♋', dateRange: '21 jun - 22 jul' },
	{ id: 'leo', name: 'Lejonet', symbol: '♌', dateRange: '23 jul - 22 aug' },
	{ id: 'virgo', name: 'Jungfrun', symbol: '♍', dateRange: '23 aug - 22 sep' },
	{ id: 'libra', name: 'Vågen', symbol: '♎', dateRange: '23 sep - 22 okt' },
	{ id: 'scorpio', name: 'Skorpionen', symbol: '♏', dateRange: '23 okt - 21 nov' },
	{ id: 'sagittarius', name: 'Skytten', symbol: '♐', dateRange: '22 nov - 21 dec' }
];

export function getZodiacFromBirthday(birthday: string | null): ZodiacSign | null {
	if (!birthday) return null;

	const date = new Date(birthday);
	if (isNaN(date.getTime())) return null;

	const month = date.getMonth() + 1;
	const day = date.getDate();

	// Date boundary logic for each sign
	if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns[0]; // Capricorn
	if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns[1]; // Aquarius
	if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return zodiacSigns[2]; // Pisces
	if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns[3]; // Aries
	if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns[4]; // Taurus
	if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return zodiacSigns[5]; // Gemini
	if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return zodiacSigns[6]; // Cancer
	if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns[7]; // Leo
	if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns[8]; // Virgo
	if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns[9]; // Libra
	if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns[10]; // Scorpio
	if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return zodiacSigns[11]; // Sagittarius

	return null;
}

export function getAgeFromBirthday(birthday: string | null): number | null {
	if (!birthday) return null;

	const birthDate = new Date(birthday);
	if (isNaN(birthDate.getTime())) return null;

	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}

	return age;
}
