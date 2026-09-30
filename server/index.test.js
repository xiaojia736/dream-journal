import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from './index.js';

test('account, journal, photo, backup and legacy import', async () => {
  const server = createApp(':memory:');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let token = '';
  const call = async (method, path, data, authorized = true) => {
    const response = await fetch(base + path, {
      method,
      headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(authorized ? { Authorization: `Bearer ${token}` } : {}) },
      body: data ? JSON.stringify(data) : undefined
    });
    return { status: response.status, body: await response.json() };
  };
  try {
    assert.equal((await call('GET', '/health', undefined, false)).body.name, '星海日记');
    assert.equal((await call('GET', '/api/entries', undefined, false)).status, 401);
    const registered = await call('POST', '/api/register', { username: 'dreamer', password: 'safe-password-123' }, false);
    assert.equal(registered.status, 201);
    token = registered.body.token;
    assert.equal((await call('POST', '/api/register', { username: 'other', password: 'safe-password-123' }, false)).status, 409);

    const created = await call('POST', '/api/entries', {
      text: '星空下的梦', type: 'dream', mood: 'calm', tags: ['星空'], occurredAt: '2025-12-14T01:00:00.000Z'
    });
    assert.equal(created.status, 201);
    const id = created.body.entry.id;
    assert.equal((await call('GET', '/api/entries')).body.entries[0].text, '星空下的梦');

    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]).toString('base64');
    const added = await call('POST', `/api/entries/${id}/photos`, { base64: png });
    assert.equal(added.status, 201);
    const photoId = added.body.photo.id;
    const photoResponse = await fetch(`${base}/api/photos/${photoId}`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(photoResponse.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await photoResponse.arrayBuffer()), Buffer.from(png, 'base64'));
    assert.equal((await call('POST', `/api/entries/${id}/photos`, { base64: Buffer.from('not an image').toString('base64') })).status, 400);

    const backup = (await call('GET', '/api/backup')).body;
    assert.equal(backup.entries[0].photos[0].base64, png);
    const legacy = [{ id: 1730000000000, text: '旧梦', type: 'dream', mood: 'happy', tags: ['童年'], date: '2024/10/27 10:00:00' }];
    assert.equal((await call('POST', '/api/import', legacy)).body.imported, 1);
    assert.equal((await call('POST', '/api/import', legacy)).body.skipped, 1);
    assert.equal((await call('GET', '/api/entries')).body.entries.length, 2);

    const changed = await call('PUT', `/api/entries/${id}`, {
      text: '修改后的梦', type: 'diary', mood: '', tags: [], occurredAt: '2025-12-15T01:00:00.000Z'
    });
    assert.equal(changed.body.entry.text, '修改后的梦');
    assert.equal((await call('DELETE', `/api/entries/${id}`)).status, 200);
    assert.equal((await call('GET', `/api/photos/${photoId}`)).status, 404);
    assert.equal((await call('POST', '/api/import', backup)).body.imported, 1);
    assert.equal((await call('GET', '/api/backup')).body.entries.find(entry => entry.id === id).photos[0].base64, png);

    assert.equal((await call('POST', '/api/logout')).status, 200);
    assert.equal((await call('GET', '/api/entries')).status, 401);
    assert.equal((await call('POST', '/api/login', { username: 'dreamer', password: 'wrong-password' }, false)).status, 401);
    assert.equal((await call('POST', '/api/login', { username: 'dreamer', password: 'safe-password-123' }, false)).status, 200);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
