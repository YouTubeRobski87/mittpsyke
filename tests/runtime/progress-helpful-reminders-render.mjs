// Kör efter produktionsbygget med adapter-node. Testservern lyssnar bara lokalt.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { connect, createServer as reservePort } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const host = '127.0.0.1';
async function binds(port) {
	const socket = connect(port, host);
	try {
		await once(socket, 'connect');
		return true;
	} catch {
		return false;
	} finally {
		socket.destroy();
	}
}

async function check(version) {
	let received;
	let release;
	const requested = new Promise((resolve) => { received = resolve; });
	const allowResponse = new Promise((resolve) => { release = resolve; });
	const fixture = createServer(async (req, res) => {
		try {
			assert.equal(req.url, '/rest/v1/rpc/helpful_reminders_schema_version');
			assert.equal(req.method, 'POST');
			assert.equal(req.headers.apikey, 'synthetic-server-key');
			received();
			await allowResponse;
			res.writeHead(version ? 200 : 404, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(version ?? { code: 'PGRST202', message: 'Function not found' }));
		} catch {
			res.writeHead(500).end();
		}
	});
	fixture.listen(0, host);
	await once(fixture, 'listening');
	const unused = reservePort();
	unused.listen(0, host);
	await once(unused, 'listening');
	const { port } = unused.address();
	await new Promise((resolve) => unused.close(resolve));

	const processUnderTest = spawn(process.execPath, ['build/index.js'], {
		env: {
			...process.env, RENDER: 'true', HOST: host, PORT: String(port),
			PUBLIC_SUPABASE_URL: 'http://' + host + ':' + fixture.address().port,
			SUPABASE_URL: '', PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon-key',
			SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server-key'
		}
	});
	const exit = once(processUnderTest, 'exit');
	let stderr = '';
	processUnderTest.stderr.setEncoding('utf8').on('data', (text) => { stderr += text; });
	processUnderTest.stdout.resume();
	try {
		const probed = await Promise.race([requested.then(() => true), exit.then(() => false), delay(5000, false, { ref: false })]);
		assert.ok(probed, 'adapter did not run the database check: ' + stderr);
		assert.equal(await binds(port), false, 'app listened before the schema was verified');
		release();
		if (!version) {
			const result = await Promise.race([exit, delay(8000, null, { ref: false })]);
			assert.ok(result && result[0] !== 0, 'startup should fail without the migration: ' + stderr);
			assert.match(stderr, /helpful reminders schema version 1 could not be verified/);
			assert.equal(await binds(port), false);
			return;
		}
		for (let i = 0; i < 100; i++) {
			if (await binds(port)) return;
			await delay(25);
		}
		assert.fail('adapter did not listen after the migration was verified: ' + stderr);
	} finally {
		release();
		if (processUnderTest.exitCode === null && processUnderTest.signalCode === null) processUnderTest.kill();
		await exit;
		fixture.closeAllConnections();
		await new Promise((resolve) => fixture.close(resolve));
	}
}

await check(null);
await check(1);
console.log('PASS: Render startup rejects missing schema before listening and accepts verified schema');