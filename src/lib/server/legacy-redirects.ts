// Old blog slugs that resolve with the same permanent redirects as hooks.server.ts.
// The sitemap uses this list so redirect URLs are not advertised as indexable URLs.
export const legacyBlogRedirects: Record<string, string> = {
	'/blogg/digital-dagbok-for-maende': '/digital-dagbok-for-maende',
	'/blogg/psykiskt-stod-online': '/psykiskt-stod-online',
	'/blogg/humorsparning': '/humorsparning',
	'/blogg/humorsparning-app-psykisk-halsa': '/humorsparning',
	'/blogg/skriva-dagbok-online': '/dagbok',
	'/blogg/att-skriva-av-sig-anonymt-online': '/anonym-dagbok-online',
	'/blogg/ovningar-for-att-lugna-tankarna': '/ovningar',
	'/blogg/stod-utan-konto-online': '/chatta-anonymt',
	'/blogg/textbaserat-samtalsstod-vid-oro': '/hjalp-mot-oro-online',
	'/blogg/nar-soka-vard-for-psykiskt-maende': '/ansvar',
	'/blogg/hur-sortera-tankar-vid-stress': '/stod-vid-stress-online',
	'/blogg/mans-psykiska-halsa': '/blogg/varfor-syns-inte-man-i-samtalet-om-psykisk-ohalsa',
	'/blogg/integritet-i-appar-for-mental-halsa': '/blogg/s%C3%A4kra-maendedata-tjanster',
	'/blogg/anonymt-stod-vs-vardkontakt': '/anonymt-samtalstod-online',
	'/blogg/reflektionsfragor-for-psykiskt-maende': '/blogg/vad-ska-jag-skriva-i-dagbok',
	'/blogg/hjalp-att-satta-ord-pa-kanslor': '/blogg/guide-till-battre-kansloverblick',
	'/blogg/ai-dagbok': '/blogg/ai-hjalper-dig-bearbeta-kanslor',
	'/blogg/textstod-eller-terapi-online-vad-passar-dig': '/blogg/ar-textstod-lika-hjalpsamt-som-samtal',
	'/blogg/ar-textstod-lika-hjalpsamt-samtal': '/blogg/ar-textstod-lika-hjalpsamt-som-samtal',
	'/blogg/anonym-hjalp-for-oro': '/hjalp-mot-oro-online',
	'/blogg/hur-fungerar-humordagbok': '/blogg/humorsparning-online',
	'/blogg/psykisk-ohalsa-stod-hjalp-sverige': '/blogg/hjaelp-vid-psykisk-ohaelsa',
	'/blogg/kbt-vid-angest': '/guider/kbt/kbt-vid-angest',
	// Kvällsklustret: Soro-artiklar som svarade på samma sökintention som
	// guiderna nedan. Guiden är målsidan, artikeln pekar dit.
	'/blogg/kvallsangest': '/guider/angest/angest-pa-kvallen',
	// Artikeln "Kvällsångest och nattångest" svarade på samma fråga som guiden
	// och är hopslagen med den. Den gamla blogg-URL:en pekade hit; båda leder nu
	// direkt till guiden, utan kedja.
	'/blogg/kvallasangest': '/guider/angest/angest-pa-kvallen',
	'/blogg/amne/oro-och-stress/kvallsangest-och-nattangest': '/guider/angest/angest-pa-kvallen',
	'/blogg/oro-pa-kvallar': '/guider/angest/hjalp-vid-oro-pa-kvallen',
	'/blogg/oro-infor-natten': '/guider/sovproblem/svart-att-somna-angest'
};

/**
 * Kvällsguider som slagits ihop med en starkare målsida. Innehållet har
 * flyttats dit, så den gamla adressen ska leda vidare i stället för att
 * försvinna. Används av hooks.server.ts för 301-svaret.
 */
export const mergedGuideRedirects: Record<string, string> = {
	'/guider/angest/angest-och-somn': '/guider/sovproblem/svart-att-somna-angest',
	'/guider/angest/nar-tankarna-inte-stannar': '/guider/overtankande/sluta-overtanka-pa-kvallen',
	'/guider/stress/mycket-tankar-pa-kvallen': '/guider/overtankande/sluta-overtanka-pa-kvallen',
	'/guider/sovproblem/altande-pa-kvallen': '/guider/overtankande/sluta-overtanka-pa-kvallen',
	'/guider/sovproblem/nattlig-oro': '/guider/angest/vaknar-med-angest'
};
