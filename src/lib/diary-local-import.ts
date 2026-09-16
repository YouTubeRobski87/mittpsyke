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
