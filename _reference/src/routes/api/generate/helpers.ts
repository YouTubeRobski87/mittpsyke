import type { WizardData, UserProfile } from '$lib/stores/wizard.svelte';
import { getZodiacFromBirthday, getAgeFromBirthday } from '$lib/utils/zodiac';
import jomojiMeanings from '$lib/data/jomojiMeanings.json';
import actsData from '../../../../acts/acts.json';
import type { ToneId } from '$lib/data/tonePrompts/types';
import { getMoodColorById } from '$lib/data/moodColors';

type EmojiMeaning = { name: string; meaning: string };
const emojiMeanings = jomojiMeanings as unknown as Record<string, EmojiMeaning>;

/**
 * Tone metadata for addon instructions.
 * Defines language and style summary for each tone so that addon content
 * (horoscope, historical events) matches the main diary entry's voice.
 */
interface ToneMetadata {
	language: 'swedish' | 'english';
	styleSummary: string;
}

const toneMetadata: Record<ToneId, ToneMetadata> = {
	classic: {
		language: 'swedish',
		styleSummary: 'varm, personlig och reflekterande'
	},
	storytelling: {
		language: 'swedish',
		styleSummary: 'berättande och målande, som en saga'
	},
	philosophical: {
		language: 'swedish',
		styleSummary: 'eftertänksam och filosofisk'
	},
	sportscaster: {
		language: 'swedish',
		styleSummary: 'energisk sportkommentator med dramatik'
	},
	'cat-perspective': {
		language: 'swedish',
		styleSummary: 'ur en katts arroganta och nyfikna perspektiv'
	},
	cynical: {
		language: 'swedish',
		styleSummary: 'cynisk och sarkastisk med mörk humor'
	},
	'drama-queen': {
		language: 'swedish',
		styleSummary: 'överdrivet dramatisk med STORA KÄNSLOR'
	},
	meme: {
		language: 'swedish',
		styleSummary: 'meme-humor och internetspråk'
	},
	cringe: {
		language: 'swedish',
		styleSummary: 'pinsam och överdrivet entusiastisk'
	},
	british: {
		language: 'english',
		styleSummary: 'British understatement, dry wit, and reserved observation. Use British English spelling (colour, favourite, realise)'
	},
	'quest-log': {
		language: 'swedish',
		styleSummary: 'som en quest-log i ett RPG-spel'
	},
	bored: {
		language: 'swedish',
		styleSummary: 'uttråkad och likgiltig'
	},
	'nature-documentary': {
		language: 'swedish',
		styleSummary: 'som David Attenborough i en naturdokumentär'
	},
	therapist: {
		language: 'swedish',
		styleSummary: 'empatisk och stöttande som en terapeut'
	},
	'ai-robot': {
		language: 'swedish',
		styleSummary: 'som en robot som försöker förstå människor'
	},
	shakespeare: {
		language: 'swedish',
		styleSummary: 'teatralisk och poetisk i Shakespearesk stil'
	},
	tabloid: {
		language: 'swedish',
		styleSummary: 'som en sensationell kvällstidning'
	},
	formal: {
		language: 'swedish',
		styleSummary: 'formell och professionell'
	},
	troubadour: {
		language: 'swedish',
		styleSummary: 'som en medeltida trubadur med rim och vers'
	},
	nerd: {
		language: 'swedish',
		styleSummary: 'nördig med referenser och fakta'
	},
	'tinfoil-hat': {
		language: 'swedish',
		styleSummary: 'konspirationsteoretisk och paranoid'
	},
	'self-help': {
		language: 'swedish',
		styleSummary: 'som en motiverande självhjälpsbok'
	},
	detective: {
		language: 'swedish',
		styleSummary: 'som en noir-detektiv som utreder dagen'
	},
	'passive-aggressive': {
		language: 'swedish',
		styleSummary: 'passiv-aggressiv med undertoner'
	},
	melodramatic: {
		language: 'swedish',
		styleSummary: 'överdrivet melodramatisk och känslosam'
	},
	chaotic: {
		language: 'swedish',
		styleSummary: 'kaotisk och osammanhängande'
	},
	bureaucratic: {
		language: 'swedish',
		styleSummary: 'byråkratisk och formell som ett myndighetsdokument'
	},
	overthinker: {
		language: 'swedish',
		styleSummary: 'övertänkande med många parenteser och sidonoteringar'
	}
};

/**
 * Get metadata for a tone, with fallback to classic.
 */
export function getToneMetadata(toneId: string): ToneMetadata {
	return toneMetadata[toneId as ToneId] || toneMetadata.classic;
}

export function formatProfileForPrompt(profile: UserProfile): string {
	const lines: string[] = [];

	if (profile.name) {
		lines.push(`Namn: ${profile.name}`);
	}
	if (profile.birthday) {
		const age = getAgeFromBirthday(profile.birthday);
		if (age !== null) {
			lines.push(`Ålder: ${age} år`);
		}
	}
	if (profile.hometown) {
		lines.push(`Bor i: ${profile.hometown}`);
	}
	if (profile.occupationDetail.length > 0) {
		lines.push(`Sysselsättning: ${profile.occupationDetail.join(', ')}`);
	}
	if (profile.family.length > 0) {
		lines.push(`Familj: ${profile.family.join(', ')}`);
	}
	if (profile.pets.length > 0) {
		lines.push(`Husdjur: ${profile.pets.join(', ')}`);
	}
	if (profile.interests.length > 0) {
		lines.push(`Intressen: ${profile.interests.join(', ')}`);
	}

	if (lines.length > 0) {
		return `OM SKRIBENTEN:\n${lines.join('\n')}`;
	}
	return '';
}

export function buildEditorModePrompt(profile: UserProfile): string {
	const profileSection = formatProfileForPrompt(profile);
	return `Du är en skicklig språkgranskare och textredigerare.

Din uppgift är att förfina användarens dagbokstext. Du ska:
- Rätta grammatik, stavning och interpunktion
- Förbättra textflöde och läsbarhet
- Behålla användarens EGNA röst, ton och personlighet
- Behålla samma språk som användaren skriver på (svenska, engelska, etc.)
- INTE lägga till innehåll som användaren inte skrev
- INTE ändra mening eller avsikt
- INTE skriva om texten i en annan stil
- Returnera den förfinade texten som ren text (inte HTML eller markdown)

${profileSection ? profileSection + '\n\n' : ''}Skriv den förfinade texten direkt utan förklaringar eller kommentarer.`;
}

export function formatWizardDataForPrompt(data: WizardData): string {
	// Editor mode: format free text instead of structured wizard fields
	if (data.editorMode && data.freeText) {
		const plainText = data.freeText
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n')
			.replace(/<(ul|ol)>/gi, '\n')
			.replace(/<[^>]+>/g, '')
			.replace(/[ \t]+/g, ' ')
			.replace(/\n /g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
		const sections: string[] = [];

		sections.push('<user-data>');

		const profileSection = formatProfileForPrompt(data.profile);
		if (profileSection) {
			sections.push(profileSection);
			sections.push('');
		}

		sections.push('ANVÄNDARENS TEXT:');
		sections.push(plainText);
		sections.push('</user-data>');

		return sections.join('\n');
	}

	// Chat mode: format conversation transcript instead of structured wizard fields
	if (data.chatMode && data.chatTranscript) {
		const sections: string[] = [];

		sections.push(`<user-data>`);

		const profileSection = formatProfileForPrompt(data.profile);
		if (profileSection) {
			sections.push(profileSection);
			sections.push('');
		}

		sections.push('KONVERSATION MED ANVÄNDAREN:');
		sections.push(data.chatTranscript);
		sections.push(`</user-data>`);

		return sections.join('\n');
	}

	const sections: string[] = [];

	sections.push(`<user-data>`);

	// Profile info (if any)
	const profileSection = formatProfileForPrompt(data.profile);
	if (profileSection) {
		sections.push(profileSection);
		sections.push(''); // Empty line separator
	}

	// Date info
	sections.push(`DAGENS INFORMATION:`);
	sections.push(`Datum: ${data.weekday} ${data.date}`);

	// Location (auto-detected via geocoding)
	if (data.locationName) {
		sections.push(`Plats: ${data.locationName}`);
	}

	// Weather (auto-detected from user's location)
	if (data.weather) {
		sections.push(`Väder: ${data.weather.temperature}°C, ${data.weather.description}`);
	}

	// Emojis that represent the day (with rich meanings for AI)
	if (data.emojis.length > 0) {
		const emojiDescriptions = data.emojis
			.map((emojiId) => {
				const emoji = emojiMeanings[emojiId];
				if (emoji) {
					return `- ${emoji.name}: ${emoji.meaning}`;
				}
				// Fallback: format the ID as a readable name
				const fallbackName = emojiId
					.split('-')
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
					.join(' ');
				return `- ${fallbackName}`;
			})
			.join('\n');
		sections.push(`Dagens känsla (emojis):\n${emojiDescriptions}`);
	}

	// Energy levels (skip sleep/energy in quick mode – user never set them)
	if (!data.quickMode) {
		sections.push(`Sömn: ${data.sleepQuality}/10`);
		sections.push(`Energi: ${data.energyLevel}/10`);
	}
	sections.push(`Humör: ${data.mood}/10`);

	// Locations
	const allLocations = [...data.locations, ...data.customLocations].filter(Boolean);
	if (allLocations.length > 0) {
		sections.push(`Platser: ${allLocations.join(', ')}`);
	}

	// Activities
	const allActivities = [...data.activities, ...data.customActivities].filter(Boolean);
	if (allActivities.length > 0) {
		sections.push(`Aktiviteter: ${allActivities.join(', ')}`);
	}

	// People
	if (data.people.length > 0) {
		sections.push(`Personer: ${data.people.join(', ')}`);
	}

	// Wins
	const wins = data.wins.filter((w) => w.trim());
	if (wins.length > 0) {
		sections.push(`Bra saker/vinster: ${wins.join('; ')}`);
	}

	// Frustrations
	const frustrations = data.frustrations.filter((f) => f.trim());
	if (frustrations.length > 0) {
		sections.push(`Motgångar/frustration: ${frustrations.join('; ')}`);
	}

	// Reflections (optional fields)
	if (data.almostHappened?.trim()) {
		sections.push(`Nästan hände: ${data.almostHappened}`);
	}
	if (data.unnecessaryThing?.trim()) {
		sections.push(`Onödig sak jag gjorde: ${data.unnecessaryThing}`);
	}
	if (data.wouldRedo?.trim()) {
		sections.push(`Skulle göra om: ${data.wouldRedo}`);
	}

	// Food
	const allMeals = [...data.meals, ...data.customMeals].filter(Boolean);
	if (allMeals.length > 0) {
		sections.push(`Mat: ${allMeals.join(', ')}`);
	}

	// Soundtrack
	const allSoundtracks = [...data.soundtracks, ...data.customSoundtracks].filter(Boolean);
	if (allSoundtracks.length > 0) {
		sections.push(`Musik/ljud: ${allSoundtracks.join(', ')}`);
	}

	// Quick mode free text
	if (data.quickText?.trim()) {
		sections.push(`Fri text om dagen: ${data.quickText}`);
	}

	// Mood color
	if (data.moodColor) {
		const moodColor = getMoodColorById(data.moodColor);
		if (moodColor) {
			sections.push(`Om dagen var en färg: ${moodColor.name} (symboliserar ${moodColor.meaning})`);
		}
	}

	// Time capsule memory
	if (data.memoryFor10Years?.trim()) {
		sections.push(`Minne att spara (tidskapsel): ${data.memoryFor10Years}`);
	}

	// Message to future self
	if (data.messageToFutureSelf?.trim()) {
		sections.push(`Meddelande till framtida jag: ${data.messageToFutureSelf}`);
	}

	// Horoscope info (if enabled)
	if (data.includeHoroscope && data.profile.birthday) {
		const zodiac = getZodiacFromBirthday(data.profile.birthday);
		if (zodiac) {
			sections.push('');
			sections.push(`HOROSKOP:`);
			sections.push(`Stjärntecken: ${zodiac.name} (${zodiac.symbol})`);
		}
	}

	sections.push(`</user-data>`);

	return sections.join('\n');
}

export function buildOnThisDayInstructions(dateString: string, toneId?: string): string {
	const metadata = getToneMetadata(toneId || 'classic');
	const isEnglish = metadata.language === 'english';

	if (isEnglish) {
		return `

"ON THIS DAY" SECTION:

After the diary entry (and horoscope if included), add a SEPARATE section with the heading "On this day..." (without any emoji - the app will add the icon).

IMPORTANT: Write this section in ENGLISH, matching the diary's language and tone.
Apply the same writing style as the main entry: ${metadata.styleSummary}

THE SECTION SHOULD:
- Start with exactly "On this day..." as the heading (no emoji before or after)
- Mention 1-2 well-known historical events that occurred on or around ${dateString}
- Only mention events you are highly confident about from your training data – do NOT guess or fabricate
- If you cannot confidently recall any events for this date, skip this section entirely
- Be brief and concise (2-4 sentences)
- Match the tone and style of the main diary entry
- Connect the event to something in today's diary if it fits naturally

EXAMPLE (in British tone):
- "On this day in 1969, Neil Armstrong took humanity's first step on the moon. Not quite as monumental as getting out of bed this morning, but rather historic nonetheless."
- "On this day in 1912, the Titanic sank. Unlike one's mood today, which seems to be floating along quite nicely."

DO NOT:
- Include any emoji in the heading – the app handles this
- Fabricate or guess events – if unsure, omit the section
- Be too long or detailed
- Force a connection to today's events if it doesn't fit naturally`;
	}

	return `

"PÅ DENNA DAG"-TILLÄGG:

Efter dagboksinlägget (och eventuellt horoskop), lägg till ett SEPARAT avsnitt med rubriken "På denna dag..." (utan emoji - appen lägger till ikonen).

VIKTIGT: Skriv detta avsnitt med SAMMA ton och stil som dagboksinlägget.
Använd stilen: ${metadata.styleSummary}

AVSNITTET SKA:
- Börja med exakt "På denna dag..." som rubrik (ingen emoji före eller efter)
- Nämna 1-2 välkända historiska händelser som inträffade på eller kring ${dateString}
- Bara nämna händelser du är mycket säker på från din träningsdata – hitta INTE PÅ
- Om du inte med säkerhet kan komma på några händelser för detta datum, hoppa över hela avsnittet
- Gärna inkludera en svensk koppling om möjligt, men internationella händelser är också bra
- Vara kort och koncist (2-4 meningar)
- Matcha tonen och stilen i huvuddagboken
- Gärna koppla händelsen till något i dagens dagbok om det passar naturligt

EXEMPEL PÅ BRA "PÅ DENNA DAG":
- "På denna dag 1969 tog Neil Armstrong mänsklighetens första steg på månen. Kanske inte lika stort som ditt steg ut ur sängen idag, men ändå historiskt."
- "På denna dag 1912 sjönk Titanic. Till skillnad från ditt humör idag som verkar flyta på fint."

GÖR INTE:
- Inkludera någon emoji i rubriken – appen hanterar detta
- Hitta på eller gissa händelser – om du är osäker, utelämna avsnittet
- Var inte för lång eller detaljerad
- Tvinga inte en koppling till dagens händelser om det inte passar`;
}

export function buildHoroscopeInstructions(zodiacName: string, toneId?: string): string {
	const metadata = getToneMetadata(toneId || 'classic');
	const isEnglish = metadata.language === 'english';

	// Map Swedish zodiac names to English
	const zodiacNameEnglish: Record<string, string> = {
		Väduren: 'Aries',
		Oxen: 'Taurus',
		Tvillingarna: 'Gemini',
		Kräftan: 'Cancer',
		Lejonet: 'Leo',
		Jungfrun: 'Virgo',
		Vågen: 'Libra',
		Skorpionen: 'Scorpio',
		Skytten: 'Sagittarius',
		Stenbocken: 'Capricorn',
		Vattumannen: 'Aquarius',
		Fiskarna: 'Pisces'
	};

	if (isEnglish) {
		const englishZodiac = zodiacNameEnglish[zodiacName] || zodiacName;
		return `

HOROSCOPE SECTION:

After the diary entry, add a SEPARATE section with the heading "Horoscope for ${englishZodiac}" (without any emoji - the app will add the zodiac icon).

IMPORTANT: Write this section in ENGLISH, matching the diary's language and tone.
Apply the same writing style as the main entry: ${metadata.styleSummary}

THE HOROSCOPE SHOULD:
- Start with exactly "Horoscope for ${englishZodiac}" as the heading (no emoji before or after)
- Be based on today's events and feelings from the diary
- Match the tone and style of the main diary entry (understated, dry wit)
- Be personal and connected to what actually happened today
- Include a positive or encouraging touch without being over the top
- Be 2-4 sentences long
- Include some "cosmic" language, like "the stars suggest..." or "the universe appears to..."

EXAMPLE (in British tone):
- "Horoscope for Scorpio" followed by "The stars observed your efforts today and were, one might say, moderately impressed. Venus is in a position that suggests an unexpected compliment may be forthcoming."
- "Horoscope for Leo" followed by "The universe took note of your persistence today. The cosmic energy tends to reward such stubbornness – one might expect a small victory in the coming week."

DO NOT:
- Include any emoji in the heading – the app handles this
- Write generic horoscopes that could apply to anyone
- Write about things that didn't happen or weren't mentioned today
- Be too serious or mystical
- Use clichés like "love awaits around the corner" unless it fits the context`;
	}

	return `

HOROSKOP-TILLÄGG:

Efter dagboksinlägget, lägg till ett SEPARAT avsnitt med rubriken "Horoskop för ${zodiacName}" (utan emoji - appen lägger till stjärntecken-ikonen).

VIKTIGT: Skriv detta avsnitt med SAMMA ton och stil som dagboksinlägget.
Använd stilen: ${metadata.styleSummary}

HOROSKOPET SKA:
- Börja med exakt "Horoskop för ${zodiacName}" som rubrik (ingen emoji före eller efter)
- Vara baserat på dagens händelser och känslor från dagboken
- Matcha tonen och stilen i huvuddagboken
- Vara personligt och kopplat till det som faktiskt hänt idag
- Innehålla en positiv eller uppmuntrande touch utan att vara krystat
- Vara 2-4 meningar långt
- Gärna inkludera lite "kosmisk" språkdräkt, som "stjärnorna antyder..." eller "universum vill..."

EXEMPEL PÅ BRA HOROSKOP:
- "Horoskop för Skorpionen" följt av "Stjärnorna såg din insats idag och var imponerade. Venus står i en position som antyder att du snart kommer få ett oväntat komplimang."
- "Horoskop för Lejonet" följt av "Universum noterade att du inte gav upp. Den kosmiska energin belönar envishet – förvänta dig en liten seger i veckan som kommer."

GÖR INTE:
- Inkludera någon emoji i rubriken – appen hanterar detta
- Skriv inte generiska horoskop som kunde gälla vem som helst
- Skriv inte om saker som inte hänt eller nämnts i dagens händelser
- Var inte för allvarlig eller mystisk
- Använd inte klyschor som "kärlek väntar runt hörnet" om det inte passar kontexten`;
}

export function buildHomeworkInstructions(toneId?: string): string {
	const metadata = getToneMetadata(toneId || 'classic');
	const isEnglish = metadata.language === 'english';

	if (isEnglish) {
		return `

"HOMEWORK" SECTION:

After the diary entry (and any other addons), add a SEPARATE section with the heading "Homework" (without any emoji - the app will add the icon).

IMPORTANT: Write this section in ENGLISH, matching the diary's language and tone.
Apply the same writing style as the main entry: ${metadata.styleSummary}

THIS SECTION SHOULD:
- Start with exactly "Homework" as the heading (no emoji before or after)
- Contain ONE single, specific reflection or challenge for the reader
- Be based on today's actual events, feelings, wins, or frustrations
- Either be action-oriented ("Tomorrow, try...") OR reflective ("Consider why...") - let the tone guide this
- Choose an appropriate timeframe naturally (tomorrow, this week, next time you...) based on context
- Match the tone and personality of the main diary entry
- Be personal and relevant - NOT generic self-help advice
- Be 1-3 sentences long

EXAMPLES OF GOOD "HOMEWORK" (adapt to match the diary's tone):
- "Tomorrow morning, before the usual rush, take five minutes to simply sit with your tea. Notice how that feels."
- "The next time someone offers help, try accepting it. Just to see what happens."
- "Consider: what would today have looked like if you'd said no to that one thing?"
- "This week, do one thing that's just for you. Not productive, not useful - just enjoyable."

DO NOT:
- Include any emoji in the heading – the app handles this
- Give generic advice that could apply to anyone
- Be preachy or lecture the reader
- Suggest anything unrelated to what actually happened today
- Give multiple tasks – just ONE focused thing`;
	}

	return `

"HEMLÄXA"-TILLÄGG:

Efter dagboksinlägget (och eventuella andra tillägg), lägg till ett SEPARAT avsnitt med rubriken "Hemläxa" (utan emoji - appen lägger till ikonen).

VIKTIGT: Skriv detta avsnitt med SAMMA ton och stil som dagboksinlägget.
Använd stilen: ${metadata.styleSummary}

AVSNITTET SKA:
- Börja med exakt "Hemläxa" som rubrik (ingen emoji före eller efter)
- Innehålla EN enda, specifik reflektion eller utmaning för läsaren
- Vara baserat på dagens faktiska händelser, känslor, vinster eller motgångar
- Antingen vara handlingsinriktat ("Imorgon, prova att...") ELLER reflekterande ("Fundera på varför...") - låt tonen styra
- Välja en lämplig tidsram naturligt (imorgon, den här veckan, nästa gång du...) baserat på sammanhanget
- Matcha tonen och personligheten i huvuddagboken
- Vara personligt och relevant - INTE generiska självhjälpsråd
- Vara 1-3 meningar långt

EXEMPEL PÅ BRA "HEMLÄXA" (anpassa till dagbokens ton):
- "Imorgon bitti, innan den vanliga stressen, ta fem minuter och bara sitt med ditt te. Lägg märke till hur det känns."
- "Nästa gång någon erbjuder hjälp, prova att tacka ja. Bara för att se vad som händer."
- "Fundera: hur hade dagen sett ut om du sagt nej till den där grejen?"
- "Den här veckan, gör en sak som bara är för dig. Inte produktiv, inte nyttig – bara njutbar."

GÖR INTE:
- Inkludera någon emoji i rubriken – appen hanterar detta
- Ge generiska råd som kunde gälla vem som helst
- Var inte predikande eller moralistisk
- Föreslå inte saker som inte relaterar till det som faktiskt hänt idag
- Ge inte flera uppgifter – bara EN fokuserad sak`;
}

function getRandomAct(): { id: number; text: string } {
	const acts = actsData.acts;
	return acts[Math.floor(Math.random() * acts.length)];
}

export function buildDailyChallengeInstructions(toneId?: string): string {
	const metadata = getToneMetadata(toneId || 'classic');
	const isEnglish = metadata.language === 'english';
	const act = getRandomAct();

	if (isEnglish) {
		return `

"DAILY CHALLENGE" SECTION:

After the diary entry (and any other addons), add a SEPARATE section with the heading "Daily Challenge" (without any emoji - the app will add the icon).

IMPORTANT: Write this section in ENGLISH, matching the diary's language and tone.
Apply the same writing style as the main entry: ${metadata.styleSummary}

You have been given a random act of kindness/well-being. Your job is to REWRITE it in the diary's tone and voice as a small challenge for tomorrow. Keep the core idea and spirit of the act, but make it sound like the diary's narrator is suggesting it.

THE ORIGINAL ACT (in Swedish):
"${act.text}"

THIS SECTION SHOULD:
- Start with exactly "Daily Challenge" as the heading (no emoji before or after)
- Rewrite the act in the diary's tone — translate to English and adapt the voice
- Frame it as a gentle challenge for tomorrow ("Tomorrow, try..." or similar)
- Keep the warmth, humour, and spirit of the original act
- Be 1-3 sentences long
- Feel like a natural suggestion from the diary's narrator, not a generic tip

DO NOT:
- Include any emoji in the heading – the app handles this
- Copy the original Swedish text verbatim – rewrite it in the diary's voice
- Add unrelated advice or expand beyond the original act's idea
- Be preachy or demanding – keep it light and inviting`;
	}

	return `

"DAGENS UTMANING"-TILLÄGG:

Efter dagboksinlägget (och eventuella andra tillägg), lägg till ett SEPARAT avsnitt med rubriken "Dagens utmaning" (utan emoji - appen lägger till ikonen).

VIKTIGT: Skriv detta avsnitt med SAMMA ton och stil som dagboksinlägget.
Använd stilen: ${metadata.styleSummary}

Du har fått en slumpmässig snäll handling/välmående-utmaning. Din uppgift är att SKRIVA OM den i dagbokens ton och röst som en liten utmaning för imorgon. Behåll kärnidén och andan i handlingen, men få det att låta som dagbokens berättare föreslår det.

DEN URSPRUNGLIGA HANDLINGEN:
"${act.text}"

AVSNITTET SKA:
- Börja med exakt "Dagens utmaning" som rubrik (ingen emoji före eller efter)
- Skriva om handlingen i dagbokens ton och röst
- Rama in det som en mjuk utmaning för imorgon ("Imorgon, prova att..." eller liknande)
- Behålla värmen, humorn och andan i den ursprungliga handlingen
- Vara 1-3 meningar långt
- Kännas som ett naturligt förslag från dagbokens berättare, inte ett generiskt tips

GÖR INTE:
- Inkludera någon emoji i rubriken – appen hanterar detta
- Kopiera originaltexten ordagrant – skriv om den i dagbokens röst
- Lägg inte till orelaterade råd eller expandera bortom den ursprungliga handlingens idé
- Var inte predikande eller krävande – håll det lätt och inbjudande`;
}
