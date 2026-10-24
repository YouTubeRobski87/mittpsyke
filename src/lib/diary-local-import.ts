// Regler för att flytta lokala inlägg till kontot efter registrering/inloggning.
//
// Ingen nätverkslogik ligger här - bara de rena, testbara reglerna för vilka
// inlägg som ska sparas och vilka som ska lämnas orörda. Själva sparningen
// sker mot /api/diary/create från komponenten, ett inlägg i taget, så att
// bara det som faktiskt lyckades tas bort ur den lokala historiken.

import type { LocalDiaryEntry } from '$lib/diary-local-history';
import type { CreateDiaryRequestBody } from '$lib/types';

/**
 * Delar upp de lokala inläggen i de som är valda för import och de som ska
 * lämnas kvar. Inget importeras utan ett aktivt val - ett tomt urval ger en
 * tom `toImport`-lista och alla inlägg oförändrade i `toKeep`.
 */
export function partitionLocalEntriesForImport(
	entries: LocalDiaryEntry[],
	selectedIds: ReadonlySet<string>
): { toImport: LocalDiaryEntry[]; toKeep: LocalDiaryEntry[] } {
	const toImport: LocalDiaryEntry[] = [];
	const toKeep: LocalDiaryEntry[] = [];

	for (const entry of entries) {
		if (selectedIds.has(entry.id)) {
			toImport.push(entry);
		} else {
			toKeep.push(entry);
		}
	}

	return { toImport, toKeep };
}

/**
 * Ett importerat inlägg blir ett vanligt dagboksinlägg med bara texten.
 * Inget humör, ingen tagg och ingen koppling till dagens fråga ärvs från den
 * lokala historiken - de fanns aldrig i den lokala texten till att börja med.
 *
 * `local_import_id` bär det lokala inläggets eget id. Servern känner igen det
 * om samma import körs om (t.ex. efter att klienten avbrutits innan den lokala
 * raden hann tas bort), så samma lokala inlägg aldrig kan skapa två
 * dagboksrader.
 */
export function buildLocalImportRequestBody(entry: LocalDiaryEntry): CreateDiaryRequestBody {
	return { text: entry.text, local_import_id: entry.id };
}

export type LocalImportOutcome = {
	imported: LocalDiaryEntry[];
	failed: LocalDiaryEntry[];
};

/**
 * Sparar de valda inläggen ett i taget. `send` returnerar true bara när
 * servern bekräftat att inlägget finns i kontot. Först då anropas
 * `onConfirmed`, som tar bort det lokalt. Ett avvisat svar, ett nätverksfel
 * eller en avbruten sida lämnar inlägget orört, och tack vare
 * `local_import_id` kan samma inlägg skickas igen utan att bli två rader.
 */
export async function importLocalEntries(
	toImport: LocalDiaryEntry[],
	send: (body: CreateDiaryRequestBody) => Promise<boolean>,
	onConfirmed: (entry: LocalDiaryEntry) => void
): Promise<LocalImportOutcome> {
	const imported: LocalDiaryEntry[] = [];
	const failed: LocalDiaryEntry[] = [];

	for (const entry of toImport) {
		let confirmed = false;
		try {
			confirmed = await send(buildLocalImportRequestBody(entry));
		} catch {
			confirmed = false;
		}

		if (confirmed) {
			onConfirmed(entry);
			imported.push(entry);
		} else {
			failed.push(entry);
		}
	}

	return { imported, failed };
}

/** Lugnt besked efter en import. Misslyckade inlägg sägs alltid ut. */
export function describeLocalImportOutcome({ imported, failed }: LocalImportOutcome): string {
	const parts: string[] = [];
	if (imported.length > 0) {
		parts.push(
			`${imported.length} ${imported.length === 1 ? 'inlägg sparat' : 'inlägg sparade'} till ditt konto.`
		);
	}
	if (failed.length > 0) {
		parts.push(
			`${failed.length} inlägg kunde inte sparas och ligger kvar på den här enheten. Försök igen.`
		);
	}
	return parts.join(' ');
}
