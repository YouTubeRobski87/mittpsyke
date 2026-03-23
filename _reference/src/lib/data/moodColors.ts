export interface MoodColor {
  id: string;
  name: string;
  cssVar: string;
  keywords: string[]; // För användaren (hover tooltip)
  meaning: string; // Utökad beskrivning för Claude
}

export const moodColors: MoodColor[] = [
  {
    id: 'red',
    name: 'Röd',
    cssVar: '--mood-red',
    keywords: ['passion', 'energi', 'intensitet', 'ilska', 'kärlek', 'mod'],
    meaning:
      'En dag präglad av stark intensitet och känslor. Kan indikera passion, djup kärlek, frustration eller ilska, men också mod och handlingskraft. Användaren har troligen upplevt något som väckt starka känslor eller agerat med beslutsamhet.'
  },
  {
    id: 'pink',
    name: 'Rosa',
    cssVar: '--mood-pink',
    keywords: ['ömhet', 'kärlek', 'lekfullhet', 'mjukhet', 'omtanke'],
    meaning:
      'En mjuk och kärleksfull dag. Antyder ömhet, romantik eller lekfullhet. Kan handla om nära relationer, självomhändertagande eller en dag då användaren känt sig extra omtänksam eller blivit omhändertagen.'
  },
  {
    id: 'purple',
    name: 'Lila',
    cssVar: '--mood-purple',
    keywords: ['kreativitet', 'mystik', 'drömmar', 'fantasi', 'inspiration'],
    meaning:
      'En kreativ eller drömsk dag med inslag av mystik och fantasi. Användaren kan ha ägnat sig åt konstnärliga aktiviteter, haft livliga dagdrömmar eller känt en koppling till något större än vardagen.'
  },
  {
    id: 'indigo',
    name: 'Indigo',
    cssVar: '--mood-indigo',
    keywords: ['intuition', 'djupa tankar', 'visdom', 'eftertanke', 'insikt'],
    meaning:
      'En introspektiv dag fylld av djupa tankar och eftertanke. Antyder att användaren funderat över livets stora frågor, lyssnat på sin intuition eller fått nya insikter om sig själv eller tillvaron.'
  },
  {
    id: 'blue',
    name: 'Blå',
    cssVar: '--mood-blue',
    keywords: ['lugn', 'tillit', 'stabilitet', 'melankoli', 'trygghet'],
    meaning:
      'En lugn och stabil dag, men kan också ha nyanser av melankoli eller vemod. Användaren har troligen känt sig trygg och tillfreds, eller möjligen lite nedstämd men på ett stillsamt, reflekterande sätt.'
  },
  {
    id: 'sky',
    name: 'Azur',
    cssVar: '--mood-sky',
    keywords: ['frihet', 'hopp', 'lätthet', 'möjligheter', 'optimism'],
    meaning:
      'En lätt och hoppfull dag som en klarblå himmel. Användaren har troligen känt sig fri, sett möjligheter framför sig eller upplevt en befriande lätthet. Antyder öppenhet för nya upplevelser.'
  },
  {
    id: 'cyan',
    name: 'Cyan',
    cssVar: '--mood-cyan',
    keywords: ['klarhet', 'förnyelse', 'friskhet', 'fokus', 'energi'],
    meaning:
      'En frisk och klar dag med känsla av förnyelse. Kan indikera mental klarhet, nya perspektiv eller en uppfriskande förändring. Användaren har troligen känt sig alert, fokuserad och redo för något nytt.'
  },
  {
    id: 'teal',
    name: 'Turkos',
    cssVar: '--mood-teal',
    keywords: ['harmoni', 'balans', 'sofistikering', 'elegans', 'mognad'],
    meaning:
      'En balanserad och harmonisk dag med en känsla av sofistikering. Antyder känslomässig mognad och jämvikt. Användaren har troligen navigerat dagen med grace och hittat en fin balans mellan olika aspekter av livet.'
  },
  {
    id: 'green',
    name: 'Grön',
    cssVar: '--mood-green',
    keywords: ['tillväxt', 'natur', 'harmoni', 'hälsa', 'lugn'],
    meaning:
      'En naturlig och harmonisk dag präglad av tillväxt. Kan handla om personlig utveckling, tid i naturen eller en känsla av välmående och hälsa. Användaren har troligen känt sig jordad och i samklang med sin omgivning.'
  },
  {
    id: 'lime',
    name: 'Lime',
    cssVar: '--mood-lime',
    keywords: ['energi', 'ungdomlighet', 'optimism', 'nytänkande', 'vår'],
    meaning:
      'En energisk och ungdomlig dag full av optimism. Antyder nytänkande, fräschhet och en nästan barnslig entusiasm. Användaren har troligen känt sig pigg, kreativ och full av nya idéer.'
  },
  {
    id: 'yellow',
    name: 'Gul',
    cssVar: '--mood-yellow',
    keywords: ['glädje', 'sol', 'optimism', 'värme', 'lycka'],
    meaning:
      'En solig och glad dag fylld av värme och optimism. Som en strålande solskendag antyder detta ren glädje, positivitet och kanske intellektuell stimulans. Användaren har troligen känt sig lycklig och energisk.'
  },
  {
    id: 'orange',
    name: 'Orange',
    cssVar: '--mood-orange',
    keywords: ['entusiasm', 'äventyr', 'social', 'värme', 'gemenskap'],
    meaning:
      'En varm och entusiastisk dag med social energi. Antyder äventyrslust, gemenskap och utåtriktad energi. Användaren har troligen umgåtts med andra, provat något nytt eller känt en stark livsaptit.'
  },
  {
    id: 'brown',
    name: 'Brun',
    cssVar: '--mood-brown',
    keywords: ['trygghet', 'jordnärhet', 'stabilitet', 'komfort', 'hem'],
    meaning:
      'En jordnära och trygg dag med fokus på det grundläggande. Som jordens färg antyder detta stabilitet, hemkänsla och komfort. Användaren har troligen uppskattat livets enkla nöjen och känt sig rotad.'
  },
  {
    id: 'gray',
    name: 'Grå',
    cssVar: '--mood-gray',
    keywords: ['neutralitet', 'stillhet', 'eftertänksamhet', 'paus', 'vila'],
    meaning:
      'En neutral och stillsam dag utan starka toppar eller dalar. Kan indikera en vilopaus, en dag i väntan eller helt enkelt en vardaglig dag utan dramatik. Inte nödvändigtvis negativt – ibland behövs gråa dagar för återhämtning.'
  },
  {
    id: 'black',
    name: 'Svart',
    cssVar: '--mood-black',
    keywords: ['kraft', 'elegans', 'allvar', 'mysterium', 'djup'],
    meaning:
      'En kraftfull och allvarlig dag med djup. Kan indikera elegans och styrka, men också tyngre känslor eller en känsla av mysterium. Användaren har troligen upplevt något betydelsefullt eller känt ett behov av att dra sig inåt.'
  },
  {
    id: 'white',
    name: 'Vit',
    cssVar: '--mood-white',
    keywords: ['renhet', 'enkelhet', 'klarhet', 'nystart', 'frid'],
    meaning:
      'En ren och enkel dag med känsla av klarhet eller nystart. Som ett blankt papper antyder detta nya möjligheter, mental frid eller en avskalad enkelhet. Användaren har troligen känt sig fri från bråte och öppen för framtiden.'
  }
];

export function getMoodColorById(id: string): MoodColor | undefined {
  return moodColors.find((color) => color.id === id);
}
