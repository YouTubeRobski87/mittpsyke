import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatProfileForPrompt,
  formatWizardDataForPrompt,
  buildOnThisDayInstructions,
  buildHoroscopeInstructions,
  getToneMetadata
} from './helpers';
import type { WizardData, UserProfile } from '$lib/stores/wizard.svelte';

// Mock zodiac utils
vi.mock('$lib/utils/zodiac', () => ({
  getAgeFromBirthday: vi.fn((birthday: string) => {
    if (birthday === '1990-06-15') return 34;
    if (birthday === '2000-01-01') return 24;
    return null;
  }),
  getZodiacFromBirthday: vi.fn((birthday: string) => {
    if (birthday === '1990-06-15') return { id: 'gemini', name: 'Tvillingarna', symbol: '♊' };
    if (birthday === '2000-01-01') return { id: 'capricorn', name: 'Stenbocken', symbol: '♑' };
    return null;
  })
}));

// Mock emoji meanings
vi.mock('$lib/data/emojiMeanings.json', () => ({
  default: {
    happy: { name: 'Glad', meaning: 'Känner glädje och lycka' },
    tired: { name: 'Trött', meaning: 'Känner sig utmattad' }
  }
}));

const defaultProfile: UserProfile = {
  name: '',
  birthday: null,
  pronouns: '',
  hometown: '',
  family: [],
  pets: [],
  occupationType: '',
  occupationDetail: [],
  interests: [],
  avatarUrl: null
};

const createMinimalWizardData = (overrides: Partial<WizardData> = {}): WizardData => ({
  profile: { ...defaultProfile },
  date: '2024-06-15',
  dateISO: '2024-06-15',
  weekday: 'Lördag',
  weather: null,
  locationName: null,
  emojis: [],
  sleepQuality: 7,
  energyLevel: 6,
  mood: 8,
  locations: [],
  customLocations: [],
  activities: [],
  customActivities: [],
  people: [],
  wins: [''],
  frustrations: [''],
  almostHappened: '',
  unnecessaryThing: '',
  wouldRedo: '',
  meals: [],
  customMeals: [],
  soundtracks: [],
  customSoundtracks: [],
  moodColor: '',
  memoryFor10Years: '',
  messageToFutureSelf: '',
  selectedTone: 'classic',
  includeHoroscope: false,
  includeOnThisDay: false,
  includeHomework: true,
  includeDailyChallenge: false,
  quickText: '',
  quickMode: false,
  chatMode: false,
  chatTranscript: '',
  editorMode: false,
  freeText: '',
  ...overrides
});

describe('formatProfileForPrompt', () => {
  it('returns empty string for empty profile', () => {
    expect(formatProfileForPrompt(defaultProfile)).toBe('');
  });

  it('formats name', () => {
    const profile = { ...defaultProfile, name: 'Alice' };
    const result = formatProfileForPrompt(profile);
    expect(result).toContain('OM SKRIBENTEN:');
    expect(result).toContain('Namn: Alice');
  });

  it('formats age from birthday', () => {
    const profile = { ...defaultProfile, birthday: '1990-06-15' };
    const result = formatProfileForPrompt(profile);
    expect(result).toContain('Ålder: 34 år');
  });

  it('formats hometown', () => {
    const profile = { ...defaultProfile, hometown: 'Stockholm' };
    const result = formatProfileForPrompt(profile);
    expect(result).toContain('Bor i: Stockholm');
  });

  it('formats occupation details', () => {
    const profile = { ...defaultProfile, occupationDetail: ['Utvecklare', 'Designer'] };
    const result = formatProfileForPrompt(profile);
    expect(result).toContain('Sysselsättning: Utvecklare, Designer');
  });

  it('formats family members', () => {
    const profile = { ...defaultProfile, family: ['Partner', 'Barn'] };
    const result = formatProfileForPrompt(profile);
    expect(result).toContain('Familj: Partner, Barn');
  });

  it('formats pets', () => {
    const profile = { ...defaultProfile, pets: ['Hund', 'Katt'] };
    const result = formatProfileForPrompt(profile);
    expect(result).toContain('Husdjur: Hund, Katt');
  });

  it('formats interests', () => {
    const profile = { ...defaultProfile, interests: ['Läsning', 'Kodning'] };
    const result = formatProfileForPrompt(profile);
    expect(result).toContain('Intressen: Läsning, Kodning');
  });

  it('formats complete profile', () => {
    const profile: UserProfile = {
      name: 'Alice',
      birthday: '1990-06-15',
      pronouns: 'hon',
      hometown: 'Stockholm',
      family: ['Partner'],
      pets: ['Hund'],
      occupationType: 'working',
      occupationDetail: ['Utvecklare'],
      interests: ['Kodning'],
      avatarUrl: null
    };
    const result = formatProfileForPrompt(profile);
    expect(result).toContain('OM SKRIBENTEN:');
    expect(result).toContain('Namn: Alice');
    expect(result).toContain('Ålder: 34 år');
    expect(result).toContain('Bor i: Stockholm');
  });
});

describe('formatWizardDataForPrompt', () => {
  it('includes date info', () => {
    const data = createMinimalWizardData();
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('DAGENS INFORMATION:');
    expect(result).toContain('Datum: Lördag 2024-06-15');
  });

  it('includes location name when present', () => {
    const data = createMinimalWizardData({ locationName: 'Södermalm, Stockholm' });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Plats: Södermalm, Stockholm');
  });

  it('includes weather when present', () => {
    const data = createMinimalWizardData({
      weather: { temperature: 22, description: 'Soligt', symbol: 'clearsky_day' }
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Väder: 22°C, Soligt');
  });

  it('includes energy levels', () => {
    const data = createMinimalWizardData({
      sleepQuality: 8,
      energyLevel: 7,
      mood: 9
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Sömn: 8/10');
    expect(result).toContain('Energi: 7/10');
    expect(result).toContain('Humör: 9/10');
  });

  it('includes emojis with meanings', () => {
    const data = createMinimalWizardData({ emojis: ['face-beaming', 'face-tired'] });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Dagens känsla (emojis):');
    expect(result).toContain('- Strålande glad:');
    expect(result).toContain('- Trött:');
  });

  it('handles unknown emojis with fallback formatting', () => {
    const data = createMinimalWizardData({ emojis: ['unknown-emoji'] });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('- Unknown Emoji');
  });

  it('combines locations and custom locations', () => {
    const data = createMinimalWizardData({
      locations: ['Hemma', 'Jobbet'],
      customLocations: ['Parken']
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Platser: Hemma, Jobbet, Parken');
  });

  it('combines activities and custom activities', () => {
    const data = createMinimalWizardData({
      activities: ['Träning'],
      customActivities: ['Läsa bok']
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Aktiviteter: Träning, Läsa bok');
  });

  it('includes people', () => {
    const data = createMinimalWizardData({ people: ['Partner', 'Vän'] });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Personer: Partner, Vän');
  });

  it('includes wins (filtering empty)', () => {
    const data = createMinimalWizardData({ wins: ['Fick mycket gjort', '', 'Bra möte'] });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Bra saker/vinster: Fick mycket gjort; Bra möte');
  });

  it('excludes wins section when all empty', () => {
    const data = createMinimalWizardData({ wins: ['', '   '] });
    const result = formatWizardDataForPrompt(data);
    expect(result).not.toContain('Bra saker/vinster');
  });

  it('includes frustrations', () => {
    const data = createMinimalWizardData({ frustrations: ['Stress', 'Trafik'] });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Motgångar/frustration: Stress; Trafik');
  });

  it('includes optional reflections', () => {
    const data = createMinimalWizardData({
      almostHappened: 'Nästan missade bussen',
      unnecessaryThing: 'Scrollade för mycket',
      wouldRedo: 'Sovit längre'
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Nästan hände: Nästan missade bussen');
    expect(result).toContain('Onödig sak jag gjorde: Scrollade för mycket');
    expect(result).toContain('Skulle göra om: Sovit längre');
  });

  it('combines meals and custom meals', () => {
    const data = createMinimalWizardData({
      meals: ['Pasta'],
      customMeals: ['Hemgjord pizza']
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Mat: Pasta, Hemgjord pizza');
  });

  it('combines soundtracks', () => {
    const data = createMinimalWizardData({
      soundtracks: ['Lo-fi'],
      customSoundtracks: ['Podcast']
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Musik/ljud: Lo-fi, Podcast');
  });

  it('includes time capsule fields', () => {
    const data = createMinimalWizardData({
      memoryFor10Years: 'En perfekt dag',
      messageToFutureSelf: 'Fortsätt kämpa!'
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('Minne att spara (tidskapsel): En perfekt dag');
    expect(result).toContain('Meddelande till framtida jag: Fortsätt kämpa!');
  });

  it('includes horoscope section when enabled with birthday', () => {
    const data = createMinimalWizardData({
      includeHoroscope: true,
      profile: { ...defaultProfile, birthday: '1990-06-15' }
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).toContain('HOROSKOP:');
    expect(result).toContain('Stjärntecken: Tvillingarna (♊)');
  });

  it('excludes horoscope when not enabled', () => {
    const data = createMinimalWizardData({
      includeHoroscope: false,
      profile: { ...defaultProfile, birthday: '1990-06-15' }
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).not.toContain('HOROSKOP:');
  });

  it('excludes horoscope when no birthday', () => {
    const data = createMinimalWizardData({
      includeHoroscope: true
    });
    const result = formatWizardDataForPrompt(data);
    expect(result).not.toContain('HOROSKOP:');
  });
});

describe('buildOnThisDayInstructions', () => {
  it('includes the date in instructions', () => {
    const result = buildOnThisDayInstructions('15 juni');
    expect(result).toContain('15 juni');
  });

  it('includes section header guidance', () => {
    const result = buildOnThisDayInstructions('15 juni');
    expect(result).toContain('"PÅ DENNA DAG"-TILLÄGG');
    expect(result).toContain('På denna dag...');
  });

  it('includes examples', () => {
    const result = buildOnThisDayInstructions('15 juni');
    expect(result).toContain('Neil Armstrong');
    expect(result).toContain('Titanic');
  });

  it('includes guidance for what NOT to do', () => {
    const result = buildOnThisDayInstructions('15 juni');
    expect(result).toContain('GÖR INTE');
    expect(result).toContain('Hitta på eller gissa händelser');
  });

  it('returns Swedish instructions for Swedish tones', () => {
    const result = buildOnThisDayInstructions('15 juni', 'classic');
    expect(result).toContain('"PÅ DENNA DAG"-TILLÄGG');
    expect(result).toContain('GÖR INTE');
    expect(result).toContain('varm, personlig och reflekterande');
  });

  it('returns English instructions for British tone', () => {
    const result = buildOnThisDayInstructions('15 juni', 'british');
    expect(result).toContain('"ON THIS DAY" SECTION');
    expect(result).toContain('DO NOT');
    expect(result).toContain('Write this section in ENGLISH');
    expect(result).toContain('British understatement');
  });

  it('includes tone style summary in Swedish instructions', () => {
    const result = buildOnThisDayInstructions('15 juni', 'drama-queen');
    expect(result).toContain('överdrivet dramatisk med STORA KÄNSLOR');
  });

  it('defaults to classic tone when toneId not provided', () => {
    const result = buildOnThisDayInstructions('15 juni');
    expect(result).toContain('varm, personlig och reflekterande');
  });
});

describe('buildHoroscopeInstructions', () => {
  it('includes zodiac name in instructions', () => {
    const result = buildHoroscopeInstructions('Tvillingarna');
    expect(result).toContain('Horoskop för Tvillingarna');
  });

  it('includes section header guidance', () => {
    const result = buildHoroscopeInstructions('Lejonet');
    expect(result).toContain('HOROSKOP-TILLÄGG');
  });

  it('includes cosmic language guidance', () => {
    const result = buildHoroscopeInstructions('Vågen');
    expect(result).toContain('stjärnorna antyder');
    expect(result).toContain('universum vill');
  });

  it('includes examples', () => {
    const result = buildHoroscopeInstructions('Skorpionen');
    expect(result).toContain('Stjärnorna såg din insats');
    expect(result).toContain('Venus');
  });

  it('includes guidance for what NOT to do', () => {
    const result = buildHoroscopeInstructions('Kräftan');
    expect(result).toContain('GÖR INTE');
    expect(result).toContain('generiska horoskop');
  });

  it('returns Swedish instructions for Swedish tones', () => {
    const result = buildHoroscopeInstructions('Lejonet', 'classic');
    expect(result).toContain('HOROSKOP-TILLÄGG');
    expect(result).toContain('Horoskop för Lejonet');
    expect(result).toContain('varm, personlig och reflekterande');
  });

  it('returns English instructions for British tone', () => {
    const result = buildHoroscopeInstructions('Lejonet', 'british');
    expect(result).toContain('HOROSCOPE SECTION');
    expect(result).toContain('Horoscope for Leo');
    expect(result).toContain('DO NOT');
    expect(result).toContain('Write this section in ENGLISH');
    expect(result).toContain('British understatement');
  });

  it('translates Swedish zodiac names to English for British tone', () => {
    const testCases = [
      { swedish: 'Väduren', english: 'Aries' },
      { swedish: 'Oxen', english: 'Taurus' },
      { swedish: 'Tvillingarna', english: 'Gemini' },
      { swedish: 'Kräftan', english: 'Cancer' },
      { swedish: 'Jungfrun', english: 'Virgo' },
      { swedish: 'Vågen', english: 'Libra' },
      { swedish: 'Skorpionen', english: 'Scorpio' },
      { swedish: 'Skytten', english: 'Sagittarius' },
      { swedish: 'Stenbocken', english: 'Capricorn' },
      { swedish: 'Vattumannen', english: 'Aquarius' },
      { swedish: 'Fiskarna', english: 'Pisces' }
    ];

    for (const { swedish, english } of testCases) {
      const result = buildHoroscopeInstructions(swedish, 'british');
      expect(result).toContain(`Horoscope for ${english}`);
    }
  });

  it('includes tone style summary in Swedish instructions', () => {
    const result = buildHoroscopeInstructions('Lejonet', 'shakespeare');
    expect(result).toContain('teatralisk och poetisk i Shakespearesk stil');
  });

  it('defaults to classic tone when toneId not provided', () => {
    const result = buildHoroscopeInstructions('Lejonet');
    expect(result).toContain('varm, personlig och reflekterande');
  });
});

describe('getToneMetadata', () => {
  it('returns correct metadata for classic tone', () => {
    const metadata = getToneMetadata('classic');
    expect(metadata.language).toBe('swedish');
    expect(metadata.styleSummary).toContain('varm');
  });

  it('returns correct metadata for british tone', () => {
    const metadata = getToneMetadata('british');
    expect(metadata.language).toBe('english');
    expect(metadata.styleSummary).toContain('British');
  });

  it('returns classic metadata for unknown tone', () => {
    const metadata = getToneMetadata('unknown-tone');
    expect(metadata.language).toBe('swedish');
    expect(metadata.styleSummary).toContain('varm');
  });

  it('returns swedish language for all tones except british', () => {
    const swedishTones = [
      'classic', 'storytelling', 'philosophical', 'sportscaster',
      'cat-perspective', 'cynical', 'drama-queen', 'meme', 'cringe',
      'quest-log', 'bored', 'nature-documentary', 'therapist', 'ai-robot',
      'shakespeare', 'tabloid', 'formal', 'troubadour', 'nerd',
      'tinfoil-hat', 'self-help', 'detective', 'passive-aggressive',
      'melodramatic', 'chaotic', 'bureaucratic', 'overthinker'
    ];

    for (const toneId of swedishTones) {
      const metadata = getToneMetadata(toneId);
      expect(metadata.language).toBe('swedish');
    }
  });
});

describe('formatWizardDataForPrompt (chat mode)', () => {
  it('uses chat transcript instead of structured fields', () => {
    const transcript = 'Användaren: Hej!\n\nIntervjuaren: Hej! Hur har din dag varit?\n\nAnvändaren: Bra, jag var på jobbet.';
    const data = createMinimalWizardData({
      chatMode: true,
      chatTranscript: transcript
    });
    const result = formatWizardDataForPrompt(data);

    expect(result).toContain('KONVERSATION MED ANVÄNDAREN:');
    expect(result).toContain(transcript);
    // Should NOT contain structured wizard sections
    expect(result).not.toContain('DAGENS INFORMATION:');
    expect(result).not.toContain('Sömn:');
    expect(result).not.toContain('Energi:');
  });

  it('wraps output in user-data tags', () => {
    const data = createMinimalWizardData({
      chatMode: true,
      chatTranscript: 'Användaren: Hej!'
    });
    const result = formatWizardDataForPrompt(data);

    expect(result).toContain('<user-data>');
    expect(result).toContain('</user-data>');
  });

  it('includes profile section when profile has data', () => {
    const data = createMinimalWizardData({
      chatMode: true,
      chatTranscript: 'Användaren: Hej!',
      profile: {
        ...defaultProfile,
        name: 'Alice',
        hometown: 'Stockholm'
      }
    });
    const result = formatWizardDataForPrompt(data);

    expect(result).toContain('OM SKRIBENTEN:');
    expect(result).toContain('Namn: Alice');
    expect(result).toContain('Bor i: Stockholm');
    expect(result).toContain('KONVERSATION MED ANVÄNDAREN:');
  });

  it('omits profile section when profile is empty', () => {
    const data = createMinimalWizardData({
      chatMode: true,
      chatTranscript: 'Användaren: Hej!'
    });
    const result = formatWizardDataForPrompt(data);

    expect(result).not.toContain('OM SKRIBENTEN:');
    expect(result).toContain('KONVERSATION MED ANVÄNDAREN:');
  });

  it('falls back to structured format when chatMode is false', () => {
    const data = createMinimalWizardData({
      chatMode: false,
      chatTranscript: 'Some transcript that should be ignored'
    });
    const result = formatWizardDataForPrompt(data);

    expect(result).toContain('DAGENS INFORMATION:');
    expect(result).not.toContain('KONVERSATION MED ANVÄNDAREN:');
  });

  it('falls back to structured format when chatTranscript is empty', () => {
    const data = createMinimalWizardData({
      chatMode: true,
      chatTranscript: ''
    });
    const result = formatWizardDataForPrompt(data);

    expect(result).toContain('DAGENS INFORMATION:');
    expect(result).not.toContain('KONVERSATION MED ANVÄNDAREN:');
  });

  it('preserves multi-turn conversation formatting', () => {
    const transcript = [
      'Användaren: Idag var speciell.',
      'Intervjuaren: Berätta mer! Vad hände?',
      'Användaren: Jag fick jobb!',
      'Intervjuaren: Grattis! Hur kändes det?',
      'Användaren: Fantastiskt, jag firade med familjen.'
    ].join('\n\n');

    const data = createMinimalWizardData({
      chatMode: true,
      chatTranscript: transcript
    });
    const result = formatWizardDataForPrompt(data);

    expect(result).toContain('Användaren: Idag var speciell.');
    expect(result).toContain('Användaren: Jag fick jobb!');
    expect(result).toContain('Intervjuaren: Grattis! Hur kändes det?');
    expect(result).toContain('Användaren: Fantastiskt, jag firade med familjen.');
  });
});

describe('short-transcript instruction', () => {
  it('transcript message count is correctly parsed by splitting on message boundaries', () => {
    // This tests the same pattern used in +server.ts for short-transcript detection
    const shortTranscript = 'Användaren: Hej!\n\nIntervjuaren: Hej! Hur var din dag?\n\nAnvändaren: Bra.';
    const messageCount = shortTranscript.split(/\n\n(?=Användaren: |Intervjuaren: )/).length;
    expect(messageCount).toBe(3);
    expect(messageCount).toBeLessThan(5);
  });

  it('longer conversation exceeds the short-transcript threshold', () => {
    const longTranscript = [
      'Användaren: Hej!',
      'Intervjuaren: Hej! Hur har din dag varit?',
      'Användaren: Bra, jag var på jobbet.',
      'Intervjuaren: Vad jobbar du med?',
      'Användaren: Jag är utvecklare.',
      'Intervjuaren: Spännande! Berätta mer.'
    ].join('\n\n');
    const messageCount = longTranscript.split(/\n\n(?=Användaren: |Intervjuaren: )/).length;
    expect(messageCount).toBe(6);
    expect(messageCount).toBeGreaterThanOrEqual(5);
  });

  it('single message counts as 1', () => {
    const singleMessage = 'Användaren: Min dag var bra.';
    const messageCount = singleMessage.split(/\n\n(?=Användaren: |Intervjuaren: )/).length;
    expect(messageCount).toBe(1);
  });
});
