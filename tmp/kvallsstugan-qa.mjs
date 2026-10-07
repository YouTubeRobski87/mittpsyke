// Temporary local-only QA server. All account/data access is synthetic.
//
// Användning:
//   node tmp/kvallsstugan-qa.mjs                 # standardläge: empty
//   QA_MODE=rich node tmp/kvallsstugan-qa.mjs    # annat standardläge
//   http://127.0.0.1:5176/framsteg?qa-mode=thin  # byt läge per besök (sparas i cookie)
//   http://127.0.0.1:5176/framsteg?qa-guest      # utloggad besökare
//
// Lägen (se tmp/qa/synthetic-supabase.mjs): empty, thin, rich.
import { createServer } from 'vite';

// Alla Supabase-adresser pekar på en domän som aldrig går att nå. Sätts före
// Vite startar och har därför företräde framför en eventuell lokal .env, så
// ingen kodväg kan råka anropa en riktig Supabase eller OpenAI.
for (const [key, value] of Object.entries({
	PUBLIC_SUPABASE_URL: 'https://qa.invalid',
	PUBLIC_SUPABASE_ANON_KEY: 'local-qa-anon-key',
	SUPABASE_URL: 'https://qa.invalid',
	SUPABASE_ANON_KEY: 'local-qa-anon-key',
	SUPABASE_SERVICE_ROLE_KEY: 'local-qa-service-key',
	OPENAI_API_KEY: 'local-qa-openai-key',
	ANTHROPIC_API_KEY: 'local-qa-anthropic-key'
})) {
	process.env[key] = value;
}

const QA_DEFAULT_MODE = process.env.QA_MODE ?? 'empty';

// Det syntetiska hälsosamtycket läggs i localStorage före hydrering. Framsteg
// läser samtycket därifrån (inte ur user_metadata), och varje ny viewport eller
// webbläsarkontext börjar annars utan det. Produktionens samtyckeslogik rörs inte.
const consentSeed = `<script>try{if(!localStorage.getItem('mittpsyke.healthConsent'))localStorage.setItem('mittpsyke.healthConsent',JSON.stringify({accepted:true,type:'health_data_processing',timestamp:'2026-09-01T12:00:00Z',policy_version:'2026-04-29'}))}catch(e){}</script>`;

// Endpoints som får köras på riktigt mot syntetisk data. Allt annat under /api
// svarar som tidigare med fasta tomma QA-svar.
const REAL_API = /^\/api\/diary\/(streak|milestones|heatmap|stats-timeline|insights)$/;

const hooks = `
import { createSyntheticSupabase } from '/tmp/qa/synthetic-supabase.mjs';
import { readQaMode, runWithQaContext, QA_MODE_PARAM, QA_MODE_COOKIE } from '/tmp/qa/qa-server.mjs';
const REAL_API = ${REAL_API};
const consentSeed = ${JSON.stringify(consentSeed)};
export async function handle({ event, resolve }) {
 const mode = readQaMode(event.url, event.cookies.get(QA_MODE_COOKIE), ${JSON.stringify(QA_DEFAULT_MODE)});
 if (event.url.searchParams.has(QA_MODE_PARAM)) event.cookies.set(QA_MODE_COOKIE, mode, { path: '/', httpOnly: false, sameSite: 'lax', secure: false });
 const guest = event.url.searchParams.has('qa-guest');
 event.locals.supabase = createSyntheticSupabase({ mode, guest });
 return runWithQaContext({ mode, guest }, async () => {
   const path = event.url.pathname;
   if (path.startsWith('/api/') && !REAL_API.test(path)) {
     const payload = path.endsWith('/streak') ? {currentStreak: 0, longestStreak: 0, lastEntryDate: null, lastEntryDaysAgo: 0} : path.endsWith('/milestones') ? {achieved: [], sections: [], nextMilestone: null, totalEntries: 0} : path.endsWith('/stats-timeline') ? {data: []} : path.endsWith('/heatmap') ? {data: {}, totalEntries: 0} : {profilePanel: null, unreadNotificationCount: 0};
     return Response.json(payload);
   }
   return resolve(event, { transformPageChunk: ({ html }) => html.replace('</head>', consentSeed + '</head>') });
 });
}`;

const clientSupabase = `
import { createSyntheticSupabase } from '/tmp/qa/synthetic-supabase.mjs';
const cookieMode = typeof document === 'undefined' ? undefined : document.cookie.split('; ').find((part) => part.startsWith('qa-mode='))?.slice(8);
export const supabase = createSyntheticSupabase({ mode: cookieMode ?? ${JSON.stringify(QA_DEFAULT_MODE)} });
`;

// createClient från @supabase/supabase-js byts mot den syntetiska klienten i
// serverkod (API-endpoints, createServiceClient/createTokenClient).
const CREATE_CLIENT_IMPORT = /import\s*\{\s*createClient(\s*,\s*type\s+SupabaseClient)?\s*\}\s*from\s*['"]@supabase\/supabase-js['"];?/;

const server = await createServer({
 server: {host: '127.0.0.1', port: 5176, strictPort: true},
 plugins: [{name:'local-cabin-qa-fixtures', enforce:'pre', transform(code, id, options) {
   const path=id.replaceAll('\\','/').split('?')[0];
   if(path.endsWith('/src/hooks.server.ts')) return {code:hooks,map:null};
   if(path.endsWith('/src/lib/supabase.ts')) return {code:clientSupabase,map:null};
   if(options?.ssr && path.includes('/src/') && CREATE_CLIENT_IMPORT.test(code)) {
     return {
       code: code.replace(CREATE_CLIENT_IMPORT, (_, typeImport) =>
         "import { createQaServerClient as createClient } from '/tmp/qa/qa-server.mjs';" +
         (typeImport ? "import type { SupabaseClient } from '@supabase/supabase-js';" : '')),
       map: null
     };
   }
 }}]
});
await server.listen();
console.log(`Synthetic local QA: http://127.0.0.1:5176 (standardläge: ${QA_DEFAULT_MODE})`);
