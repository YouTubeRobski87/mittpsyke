// Run against a fresh loopback-only PostgreSQL database named mittpsyke_helpful_test.
// Set HELPFUL_TEST_PG_URL and HELPFUL_TEST_PG_MODULE (path to the package.json of a directory with pg installed).
// Build the app first so the workers can exercise the compiled API handlers.
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const url = new URL(process.env.HELPFUL_TEST_PG_URL);
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname));
assert.equal(url.pathname, '/mittpsyke_helpful_test');
const { Client } = createRequire(process.env.HELPFUL_TEST_PG_MODULE)('pg');
const a = '00000000-0000-4000-8000-00000000000a';
const b = '00000000-0000-4000-8000-00000000000b';
const anon = '00000000-0000-4000-8000-00000000000c';
const migrationDir = new URL('../../supabase/migrations/', import.meta.url);

async function inAccount(db, account, query, isAnonymous = false) {
	await db.query('begin');
	try {
		await db.query('set local role authenticated');
		await db.query("select set_config('request.jwt.claims', $1, true)", [
			JSON.stringify({ sub: account, is_anonymous: isAnonymous })
		]);
		const result = await query();
		await db.query('commit');
		return result;
	} catch (error) {
		await db.query('rollback');
		throw error;
	}
}

async function serve() {
	const { GET, POST } = await import('../../.svelte-kit/output/server/entries/endpoints/api/progress/helpful-reminders/_server.ts.js');
	const { GET: exportAccount } = await import('../../.svelte-kit/output/server/entries/endpoints/api/account/export/_server.ts.js');
	const { set_private_env } = await import('../../.svelte-kit/output/server/internal.js');
	const db = new Client({ connectionString: url.href, application_name: process.argv[3] });
	await db.connect();
	const server = createServer(async (req, res) => {
		const account = req.headers['x-test-account'] ?? a;
		const requestUrl = new URL(req.url, 'http://127.0.0.1');
		if (requestUrl.pathname === '/export') {
			const response = await exportAccount({ request: new Request(requestUrl, { headers: req.headers }) });
			res.writeHead(response.status, Object.fromEntries(response.headers));
			res.end(await response.text());
			return;
		}
		if (requestUrl.pathname === '/auth/v1/user' || requestUrl.pathname.startsWith('/rest/v1/')) {
			// Local Auth/PostgREST transport for the compiled account export.
			const id = req.headers.authorization?.split(' ')[1];
			assert.ok([a, b].includes(id));
			let result = [];
			if (requestUrl.pathname === '/auth/v1/user') {
				result = { id, user_metadata: { progress_helpful_reminders: ['Promenader'] } };
			} else if (requestUrl.pathname === '/rest/v1/user_helpful_reminders') {
				assert.equal(requestUrl.searchParams.get('user_id'), 'eq.' + id);
				({ rows: result } = await inAccount(db, id, () => db.query(
					'select item_id, active, revision from public.user_helpful_reminders where user_id = $1', [id]
				)));
			}
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(result));
			return;
		}
		const locals = { supabase: {
			auth: { getUser: async () => ({ data: { user: { id: account, is_anonymous: account === anon } } }) },
			from: (table) => {
				assert.equal(table, 'user_helpful_reminders');
				return { select: () => ({ eq: async (column, id) => {
					assert.equal(column, 'user_id');
					const { rows } = await inAccount(db, account, () => db.query(
						'select item_id, active, revision from public.user_helpful_reminders where user_id = $1', [id]
					));
					return { data: rows };
				} }) };
			},
			rpc: async (name, { p_item_id, p_active, p_revision }) => {
				assert.equal(name, 'set_helpful_reminder');
				const { rows } = await inAccount(db, account, async () => {
					process.send({ event: 'writing' });
					const result = await db.query('select * from public.set_helpful_reminder($1, $2, $3)', [
						p_item_id, p_active, p_revision
					]);
					if (req.headers['x-test-hold']) {
						const released = once(process, 'message');
						process.send({ event: 'held' });
						await released;
					}
					return result;
				});
				return { data: rows };
			}
		} };
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		const response = req.method === 'POST'
			? await POST({ locals, request: new Request(requestUrl, {
				method: 'POST', headers: { 'Content-Type': 'application/json' }, body: Buffer.concat(chunks)
			}) })
			: await GET({ locals, request: new Request(requestUrl, { headers: req.headers }) });
		if (req.headers['x-test-drop']) {
			assert.equal(response.status, 200);
			res.destroy();
		} else {
			res.writeHead(response.status, Object.fromEntries(response.headers));
			res.end(await response.text());
		}
	});
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	const { port } = server.address();
	set_private_env({ SUPABASE_URL: 'http://127.0.0.1:' + port, SUPABASE_ANON_KEY: 'synthetic-local-key' });
	process.send({ event: 'ready', port, pid: db.processID });
	process.on('disconnect', async () => {
		server.closeAllConnections();
		server.close();
		await db.end();
	});
}

function awaitEvent(worker, event) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => finish(new Error('Timeout: ' + event)), 10_000);
		const onMessage = (message) => { if (message.event === event) finish(null, message); };
		const onExit = (code) => finish(new Error('Worker exited: ' + code));
		function finish(error, message) {
			clearTimeout(timeout);
			worker.off('message', onMessage);
			worker.off('exit', onExit);
			if (error) reject(error);
			else resolve(message);
		}
		worker.on('message', onMessage);
		worker.on('exit', onExit);
	});
}

async function startWorker(name) {
	const worker = fork(fileURLToPath(import.meta.url), ['worker', name]);
	try {
		const { port, pid } = await awaitEvent(worker, 'ready');
		return { worker, pid, base: 'http://127.0.0.1:' + port };
	} catch (error) {
		worker.kill();
		throw error;
	}
}

function post(server, item, action, revision, headers = {}, accountId = a) {
	return fetch(server.base, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify({ accountId, item, action, revision }),
		signal: AbortSignal.timeout(12_000)
	});
}

async function list(server, account = a) {
	const response = await fetch(server.base, { headers: { 'x-test-account': account, 'X-MittPsyke-Account-Id': account } });
	assert.equal(response.status, 200);
	return (await response.json()).reminders;
}

async function overlap(first, second, db, left, right, sameItem = false) {
	const held = awaitEvent(first.worker, 'held');
	const pending = post(first, ...left, { 'x-test-hold': '1' });
	let released = false;
	try {
		await held;
		const started = awaitEvent(second.worker, 'writing');
		const competing = post(second, ...right);
		await started;
		if (!sameItem) {
			// The second request commits before the first transaction is released.
			assert.equal((await competing).status, 200);
		} else {
			let blocked = false;
			for (let i = 0; i < 150 && !blocked; i++) {
				const { rows } = await db.query(
					'select wait_event_type from pg_stat_activity where pid = $1', [second.pid]
				);
				blocked = rows.some((row) => row.wait_event_type === 'Lock');
				if (!blocked) await delay(20);
			}
			assert.ok(blocked, 'same-row transaction must overlap and wait for the lock');
		}
		first.worker.send('release');
		released = true;
		assert.equal((await pending).status, 200);
		assert.equal((await competing).status, sameItem ? 409 : 200);
	} finally {
		if (!released) first.worker.send('release');
	}
}

async function run() {
	const db = new Client({ connectionString: url.href });
	const workers = [];
	await db.connect();
	try {
		const { rows: [guard] } = await db.query("select to_regnamespace('auth') as auth");
		assert.equal(guard.auth, null, 'Use a fresh disposable database');
		await db.query(`
			create role authenticated;
			create role anon;
			create role service_role;
			create schema auth;
			create table auth.users (id uuid primary key, raw_user_meta_data jsonb, is_anonymous boolean);
			create function auth.jwt() returns jsonb language sql stable as $$
				select nullif(current_setting('request.jwt.claims', true), '')::jsonb
			$$;
			create function auth.uid() returns uuid language sql stable as $$
				select (auth.jwt() ->> 'sub')::uuid
			$$;
			grant usage on schema auth to authenticated, anon;
		`);
		await db.query('insert into auth.users values ($1, $4, false), ($2, $5, false), ($3, $4, true)', [
			a, b, anon,
			JSON.stringify({ progress_helpful_reminders: ['Musik', 'Musik', 'fritext'] }),
			JSON.stringify({ progress_helpful_reminders: 'felaktigt format' })
		]);
		const migration = (await readdir(migrationDir)).find((name) => name.endsWith('_user_helpful_reminders.sql'));
		const migrationSql = await readFile(new URL(migration, migrationDir), 'utf8');
		await db.query(migrationSql);
		const { rows: [grants] } = await db.query(`
			select has_function_privilege('anon', 'public.helpful_reminders_schema_version()', 'execute') as anon,
				has_function_privilege('authenticated', 'public.helpful_reminders_schema_version()', 'execute') as authenticated,
				has_function_privilege('service_role', 'public.helpful_reminders_schema_version()', 'execute') as service_role
		`);
		assert.deepEqual(grants, { anon: false, authenticated: false, service_role: true });
		await db.query('set role service_role');
		assert.deepEqual((await db.query('select public.helpful_reminders_schema_version() as version')).rows, [{ version: 1 }]);
		await db.query('reset role');
		const first = await startWorker('helpful-worker-a');
		workers.push(first.worker);
		const second = await startWorker('helpful-worker-b');
		workers.push(second.worker);
		assert.deepEqual(await list(first), [{ item_id: 'music', active: true, revision: 1 }]);
		assert.deepEqual(await list(first, b), []);
		await assert.rejects(inAccount(db, b, () => db.query(
			"insert into public.user_helpful_reminders values ($1, 'walk', true, 1)", [a]
		)), { code: '42501' });
		await assert.rejects(inAccount(db, anon, () => db.query(
			"select * from public.set_helpful_reminder('music', true, 0)"
		), true), { code: '42501' });
		assert.equal((await inAccount(db, b, () => db.query(
			'select * from public.user_helpful_reminders where user_id = $1', [a]
		))).rowCount, 0);
		assert.equal((await post(second, 'rest', 'add', 0, { 'x-test-account': b })).status, 403);

		await db.query('delete from public.user_helpful_reminders');
		const active = async () => (await list(first)).filter((row) => row.active).map((row) => row.item_id).sort();
		await overlap(first, second, db, ['music', 'add', 0], ['rest', 'add', 0]);
		assert.deepEqual(await active(), ['music', 'rest']);
		assert.equal((await post(first, 'rest', 'remove', 1)).status, 200);
		await overlap(first, second, db, ['music', 'remove', 1], ['rest', 'add', 2]);
		assert.deepEqual(await active(), ['rest']);
		assert.equal((await post(first, 'music', 'add', 2)).status, 200);
		await overlap(first, second, db, ['music', 'remove', 3], ['rest', 'remove', 3]);
		assert.deepEqual(await active(), []);
		await overlap(first, second, db, ['music', 'add', 4], ['music', 'add', 4], true);
		assert.equal((await post(first, 'music', 'remove', 5)).status, 200);
		assert.equal((await post(second, 'music', 'add', 4)).status, 409);
		assert.deepEqual(await active(), []);

		await assert.rejects(post(first, 'rest', 'add', 4, { 'x-test-drop': '1' }), /fetch failed/);
		assert.deepEqual(await active(), ['rest']);
		assert.equal((await post(second, 'rest', 'add', 4)).status, 409);
		const beforeReplay = await list(first);
		await db.query(migrationSql);
		assert.deepEqual(await list(first), beforeReplay, 'reapplying must preserve revisions and removed choices');
		for (const [id, expected] of [[a, ['Vila']], [b, []]]) {
			const exported = await fetch(first.base + '/export', { headers: { Authorization: 'Bearer ' + id } });
			assert.equal(exported.status, 200);
			assert.equal(exported.headers.get('cache-control'), 'no-store');
			assert.deepEqual((await exported.json()).data.installningar.progress_helpful_reminders, expected);
		}
		await db.query('delete from auth.users where id = $1', [a]);
		assert.equal((await db.query('select * from public.user_helpful_reminders where user_id = $1', [a])).rowCount, 0);
		assert.deepEqual(await list(first, b), []);
		console.log('PASS: PostgreSQL, two API processes, overlapping writes, retry, lost response, migration, export, RLS and deletion');
	} finally {
		await Promise.all(workers.map(async (worker) => {
			if (worker.exitCode !== null || worker.signalCode !== null) return;
			const exit = once(worker, 'exit');
			worker.kill();
			await exit;
		}));
		await db.end();
	}
}

await (process.argv[2] === 'worker' ? serve() : run());