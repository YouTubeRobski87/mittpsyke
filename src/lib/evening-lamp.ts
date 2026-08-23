import type { ProgressCompanionDayState } from '$lib/progressCompanion';

export type EveningLampStyle = {
	idleOpacity: number;
	peakOpacity: number;
	lowOpacity: number;
	glowOpacity: number;
};

const LAMP_STYLES: Record<ProgressCompanionDayState, EveningLampStyle> = {
	morning: { idleOpacity: 0.5, peakOpacity: 0.55, lowOpacity: 0.47, glowOpacity: 0.1 },
	day: { idleOpacity: 0.5, peakOpacity: 0.55, lowOpacity: 0.47, glowOpacity: 0.1 },
	evening: { idleOpacity: 0.72, peakOpacity: 0.8, lowOpacity: 0.68, glowOpacity: 0.2 },
	night: { idleOpacity: 0.82, peakOpacity: 0.88, lowOpacity: 0.78, glowOpacity: 0.26 }
};

/** Ett rent, litet ljussteg för samma stuga när Stockholmskvällen blir senare. */
export function getEveningLampStyle(timeOfDay: ProgressCompanionDayState): EveningLampStyle {
	return LAMP_STYLES[timeOfDay];
}

export function getEveningLampCssVariables(timeOfDay: ProgressCompanionDayState): string {
	const style = getEveningLampStyle(timeOfDay);
	return [
		`--cabin-lamp-idle-opacity: ${style.idleOpacity}`,
		`--cabin-lamp-peak-opacity: ${style.peakOpacity}`,
		`--cabin-lamp-low-opacity: ${style.lowOpacity}`,
		`--cabin-lamp-glow-opacity: ${style.glowOpacity}`
	].join('; ');
}
