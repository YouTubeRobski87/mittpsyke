// Tidpunkt på dygnet för "följeslagaren" – styr vilka ambient-effekter
// som visas. Speglar getProgressCompanionDayState (Stockholm-tid)
// men med egna intervall och svenska värden.

export type TimeOfDay = 'morgon' | 'dag' | 'kvall' | 'natt';

/**
 * Returnerar tid på dygnet utifrån aktuell timme i svensk tid.
 * Intervall: 5–10 morgon, 10–18 dag, 18–22 kväll, 22–5 natt.
 */
export function getTimeOfDay(date = new Date()): TimeOfDay {
	const hour = Number(
		new Intl.DateTimeFormat('sv-SE', {
			timeZone: 'Europe/Stockholm',
			hour: 'numeric',
			hour12: false
		}).format(date)
	);

	if (!Number.isFinite(hour)) return 'dag';
	if (hour >= 5 && hour < 10) return 'morgon';
	if (hour >= 10 && hour < 18) return 'dag';
	if (hour >= 18 && hour < 22) return 'kvall';
	return 'natt';
}
