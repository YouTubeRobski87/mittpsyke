// Bygger dagbokstexten för den guidade incheckningen.
//
// Ligger i en egen modul för att kontraktet ska gå att testa på riktigt: det
// som avgör om AI-genererad text hamnar i användarens dagbok får inte bara
// vara en rad inne i en komponent. Regeln är att MittPsykes reflektion följer
// med ENDAST när användaren själv har valt det - allt annat i texten är
// användarens egna svar.

export type CheckinDiaryInput = {
	selectedMoods: string[];
	selectedFactors: string[];
	selectedDuration: string;
	selectedSelfCare: string[];
	selectedHelp: string[];
	moodFreeText: string;
	factorFreeText: string;
	/** MittPsykes AI-reflektion. Tas bara med när includeReflection är sann. */
	reflection: string;
	/** Användarens aktiva val. Av som standard i incheckningen. */
	includeReflection: boolean;
};

/** Rubriken AI-reflektionen sparas under, så den aldrig blandas ihop med egna ord. */
export const CHECKIN_REFLECTION_HEADING = 'MittPsyke-reflektion:';

function formatSelectedList(items: string[]) {
	if (items.length === 0) return '- Inget valt';
	return items.map((item) => `- ${item}`).join('\n');
}

function formatSingleValue(value: string) {
	return value ? `- ${value}` : '- Inget valt';
}

export function buildCheckinDiaryContent(input: CheckinDiaryInput): string {
	const ownWords = [input.moodFreeText.trim(), input.factorFreeText.trim()].filter(Boolean);

	const blocks = [
		'Guidad incheckning',
		'',
		'Hur jag mår just nu:',
		formatSelectedList(input.selectedMoods),
		'',
		'Vad som påverkar:',
		formatSelectedList(input.selectedFactors),
		'',
		'Hur länge det har känts så:',
		formatSingleValue(input.selectedDuration),
		'',
		'Gjort för mig själv idag:',
		formatSelectedList(input.selectedSelfCare),
		'',
		'Vad som skulle hjälpa just nu:',
		formatSelectedList(input.selectedHelp)
	];

	if (ownWords.length > 0) {
		blocks.push('', 'Egna ord:', ownWords.join('\n'));
	}

	// AI-reflektionen läggs bara till om användaren aktivt valt det. Annars
	// sparas enbart användarens egna svar - ingen AI-genererad text följer med.
	if (input.includeReflection && input.reflection.trim()) {
		blocks.push('', CHECKIN_REFLECTION_HEADING, input.reflection.trim());
	}

	return blocks.join('\n');
}
