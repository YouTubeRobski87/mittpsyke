export type ProgressLowDataCopy = {
	heading: string;
	description: string;
};

export function getProgressLowDataCopy(entryCount: number): ProgressLowDataCopy {
	if (entryCount === 1) {
		return {
			heading: 'Din första text finns med',
			description:
				'Det är för tidigt att visa ett mönster, men texten finns med i underlaget här. När något konkret återkommer visas det på den här sidan.'
		};
	}

	if (entryCount > 1) {
		return {
			heading: 'Dina texter finns med',
			description:
				'Det är fortfarande för tidigt att visa ett mönster, men dina sparade texter finns med i underlaget här. När något konkret återkommer visas det på den här sidan.'
		};
	}

	return {
		heading: 'Det får ta lite tid',
		description:
			'Det finns ännu inte tillräckligt med sparat underlag för att visa personliga mönster. När något konkret börjar synas samlas det här — utan att dagar du inte skriver räknas som sämre.'
	};
}
