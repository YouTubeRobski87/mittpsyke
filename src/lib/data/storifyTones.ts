export type StorifyTone = {
	id: string;
	label: string;
	emoji: string;
	description: string;
};

export const storifyTones: StorifyTone[] = [
	{ id: 'classic', label: 'Klassisk Dagbok (Classic)', emoji: '📒', description: 'Traditional "Dear Diary" format' },
	{ id: 'storytelling', label: 'Berättelse (Storytelling)', emoji: '📖', description: 'Your day as a narrative adventure' },
	{ id: 'philosophical', label: 'Filosofisk (Philosophical)', emoji: '🤔', description: 'Deep reflections and existential musings' },
	{ id: 'sportscaster', label: 'Sportkommentator', emoji: '🎙️', description: 'Livet som en sändning' },
	{ id: 'cat-perspective', label: 'Kattperspektiv', emoji: '🐱', description: 'Dagen sedd av en katt' },
	{ id: 'cynical', label: 'Cyniker', emoji: '😏', description: 'Ironisk och avmätt' },
	{ id: 'drama-queen', label: 'Dramaqueen', emoji: '👸', description: 'Allt är en katastrof' },
	{ id: 'meme', label: 'Meme-format', emoji: '😂', description: 'Internetkultur och humor' },
	{ id: 'cringe', label: 'Cringe', emoji: '😬', description: 'Pinsamt och självmedveten' },
	{ id: 'british', label: 'Brittisk underdrift', emoji: '🫖', description: 'Torr humor och "quite nice"' },
	{ id: 'quest-log', label: 'Quest Log', emoji: '🎮', description: 'Your day as an RPG adventure' },
	{ id: 'bored', label: 'Uttråkad (Bored)', emoji: '🥱', description: 'Minimal enthusiasm, maximum vibes' },
	{ id: 'nature-documentary', label: 'Naturdokumentär', emoji: '🌿', description: 'David Attenborough om vardagen' },
	{ id: 'therapist', label: 'Psykolog (Therapist)', emoji: '🧠', description: 'Therapist notes with warm insight' },
	{ id: 'ai-robot', label: 'AI-robot', emoji: '🤖', description: 'Beräknande och databeroende' },
	{ id: 'shakespeare', label: 'Shakespeare', emoji: '🎭', description: 'Elizabetansk dramatik' },
	{ id: 'tabloid', label: 'Lösnummer', emoji: '📰', description: 'Kvällstidningens förstasida' },
	{ id: 'formal', label: 'Formell rapport', emoji: '💼', description: 'Professionell och saklig' },
	{ id: 'troubadour', label: 'Troubadour', emoji: '🎵', description: 'Poetisk och sånglig' },
	{ id: 'nerd', label: 'Nörden', emoji: '🤓', description: 'Detaljer, fakta och sidospår' },
	{ id: 'tinfoil-hat', label: 'Konspirationsteoretiker', emoji: '🕵️', description: 'Allt hänger ihop' },
	{ id: 'self-help', label: 'Livscoach (Life Coach)', emoji: '✨', description: 'Uplifting advice and encouragement' },
	{ id: 'detective', label: 'Detektiv', emoji: '🔍', description: 'Löser gåtan om din dag' },
	{ id: 'passive-aggressive', label: 'Passivt aggressiv', emoji: '🙂', description: 'Fint, allt är helt fint' },
	{ id: 'melodramatic', label: 'Melodramatisk', emoji: '😭', description: 'Allt är episkt viktigt' },
	{ id: 'chaotic', label: 'Kaotisk', emoji: '🌪️', description: 'Associativt och oförutsägbart' },
	{ id: 'bureaucratic', label: 'Byråkratisk', emoji: '📋', description: 'Formulär och protokoll' },
	{ id: 'overthinker', label: 'Grubblande (Overthinker)', emoji: '🌀', description: 'Analyzing every detail, over and over' }
];

export const activeStorifyToneIds = [
	'classic',
	'storytelling',
	'philosophical',
	'quest-log',
	'bored',
	'therapist',
	'self-help',
	'overthinker'
] as const;

export const activeStorifyTones: StorifyTone[] = activeStorifyToneIds
	.map((id) => storifyTones.find((tone) => tone.id === id))
	.filter((tone): tone is StorifyTone => Boolean(tone));
