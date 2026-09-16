// Temporary local-only QA server. All account/data access is synthetic.
import { createServer } from 'vite';
const fixture = `
const user = { id: '00000000-0000-4000-8000-000000000001', is_anonymous: false, created_at: '2026-09-01T12:00:00Z', user_metadata: { display_name: 'Test', health_data_processing_consent: { accepted: true, type: 'health_data_processing', timestamp: '2026-09-01T12:00:00Z', policy_version: '2026-04-29' } } };
const session = { user, access_token: 'local-qa-not-a-real-token' };
function query() { const result = { data: null, error: null, count: 0 }; const chain = new Proxy({}, { get: (_, key) => key === 'then' ? (resolve) => Promise.resolve(resolve(result)) : () => chain }); return chain; }
const supabase = { auth: { getUser: async () => ({ data: {user}, error: null }), getSession: async () => ({ data: {session}, error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({ error: null }) }, from: query, rpc: query };
`;
const hooks = `${fixture}
export async function handle({event, resolve}) {
 event.locals.supabase = event.url.searchParams.has('qa-guest') ? { ...supabase, auth: { ...supabase.auth, getUser: async () => ({data: {user: null}}) } } : supabase;
 if(event.url.pathname.startsWith('/api/')) {
   const path = event.url.pathname;
   const payload = path.endsWith('/streak') ? {currentStreak: 0, longestStreak: 0, lastEntryDate: null, lastEntryDaysAgo: 0} : path.endsWith('/milestones') ? {achieved: [], sections: [], nextMilestone: null, totalEntries: 0} : path.endsWith('/stats-timeline') ? {data: []} : path.endsWith('/heatmap') ? {data: {}, totalEntries: 0} : {profilePanel: null, unreadNotificationCount: 0};
   return Response.json(payload);
 }
 return resolve(event);
}`;
const server = await createServer({
 server: {host: '127.0.0.1', port: 5176, strictPort: true},
 plugins: [{name:'local-cabin-qa-fixtures', enforce:'pre', transform(code,id) {
   const path=id.replaceAll('\\','/').split('?')[0];
   if(path.endsWith('/src/hooks.server.ts')) return {code:hooks,map:null};
   if(path.endsWith('/src/lib/supabase.ts')) return {code:fixture+'\nexport { supabase };',map:null};
 }}]
});
await server.listen();
console.log('Synthetic local QA: http://127.0.0.1:5176');
