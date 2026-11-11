// Återkoppling i gästdagboken: vad som finns lokalt och när den lokala
// återblicken visas. Bara text som går att räkna fram i webbläsaren - ingen
// tolkning av innehållet, ingen AI och inget som skickas någonstans.

import {
	MIN_LOCAL_DAYS_FOR_RETROSPECT,
	MIN_LOCAL_ENTRIES_FOR_RETROSPECT,
	type LocalRetrospect
} from '$lib/diary-local-retrospect';

/**
 * Raden under skrivytan. Ordet "sparat" undviks med flit: för gästen är
 * texten ett lokalt utkast, och "sparat" är reserverat för kontots dagbok.
 */
export function describeLocalDraftStatus(savedAt: number | null): string {
	if (savedAt === null) return 'Lokalt utkast i den här webbläsaren.';
	const time = new Date(savedAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
	return `Lokalt utkast i den här webbläsaren, senast kl. ${time}.`;
}

/**
 * Förklarar när återblicken visas, innan det finns tillräckligt att räkna på.
 * Returnerar null när inget är skrivet eller när återblicken redan visas.
 */
export function describeRetrospectThreshold(retrospect: LocalRetrospect): string | null {
	if (retrospect.status !== 'not-enough' || retrospect.entryCount === 0) return null;

	const rule = `När du har minst ${MIN_LOCAL_ENTRIES_FOR_RETROSPECT} anteckningar från minst ${MIN_LOCAL_DAYS_FOR_RETROSPECT} olika dagar visas här vilka ord som återkommer i dem.`;
	const count =
		retrospect.entryCount === 1 ? '1 anteckning' : `${retrospect.entryCount} anteckningar`;

	if (retrospect.entryCount >= MIN_LOCAL_ENTRIES_FOR_RETROSPECT) {
		return `${rule} Just nu finns ${count} från samma dag.`;
	}
	return `${rule} Just nu finns ${count} i den här webbläsaren.`;
}
