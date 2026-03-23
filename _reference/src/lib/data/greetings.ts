/**
 * Time-based greetings for returning (logged-in) users.
 * Fixed title per time period, random subtitle picked from options.
 */

type TimePeriod = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

const titles: Record<TimePeriod, string> = {
  morning: 'Godmorgon, {name}!',
  midday: 'Hej, {name}!',
  afternoon: 'Hejsan, {name}!',
  evening: 'God kväll, {name}!',
  night: 'Hej där, {name}!'
};

const subtitles: Record<TimePeriod, string[]> = {
  morning: [
    'Redo för en ny dag?',
    'Hoppas du sovit gott!',
    'Världen väntar på dig.',
    'Ny dag, nya möjligheter!',
    'Dagen är ett tomt blad – fyll det.',
    'Dags att skriva historia.',
    'Redo att ta dig an dagen?',
    'Vad har du på gång idag?',
    'Är du riktigt vaken än?',
    'Solen är uppe – är du?'
  ],
  midday: [
    'Hur går det mitt på dagen?',
    'Dags att fånga förmiddagen?',
    'Lunchpaus? Perfekt för att skriva!',
    'Halvvägs genom dagen redan!',
    'Förmiddagen är avklarad – bra jobbat!',
    'Ta en paus och samla tankarna.',
    'Behöver du en kreativ paus?',
    'En snabb reflektion mitt i allt?',
    'Vad har hänt hittills idag?',
    'Stanna upp en stund och skriv!'
  ],
  afternoon: [
    'Hur har dagen varit?',
    'Har du hunnit med allt idag?',
    'Eftermiddagen är perfekt för reflektion.',
    'Nedräkningen mot kvällen har börjat!',
    'Snart är arbetsdagen slut!',
    'Dags att landa lite?',
    'Behöver du ventilera lite?',
    'Ta en stund för dig själv.',
    'Slutspurten av dagen, hur går det?',
    'Redo att fånga dagens ögonblick?'
  ],
  evening: [
    'Dags att sammanfatta dagen?',
    'Hur var dagen?',
    'Redo att skriva?',
    'Dags att varva ner?',
    'Skriv ner dagens höjdpunkter!',
    'Hur summerar du den här dagen?',
    'Dags att reflektera?',
    'Vad tar du med dig från idag?',
    'Vad var dagens bästa ögonblick?',
    'Redo att fånga dagens ögonblick?'
  ],
  night: [
    'Uppe sent?',
    'En nattlig anteckning?',
    'Kan du inte sova?',
    'Perfekt tid för att skriva.',
    'En nattlig reflektion?',
    'Fortfarande vaken? Bra, skriv ner det.',
    'Nattugglan i dig vill visst skriva.',
    'Fånga nattens tankar innan de flyger iväg.',
    'Inte trött än? Skriv av dig!',
    'Världen sover men du har något att säga.'
  ]
};

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 13) return 'midday';
  if (hour >= 13 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Get the fixed title greeting for the current time of day.
 */
export function getGreeting(name: string): string {
  const period = getTimePeriod(new Date().getHours());
  return titles[period].replace('{name}', name);
}

/**
 * Get a random subtitle for the current time of day.
 */
export function getSubtitle(): string {
  const period = getTimePeriod(new Date().getHours());
  const options = subtitles[period];
  return options[Math.floor(Math.random() * options.length)];
}
