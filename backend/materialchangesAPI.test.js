const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const materialChangesRouter = require('./materialchangesAPI');

const startServer = async (pool) => {
  const app = express();
  app.use(express.json());
  app.use('/api/materialchangesAPI', materialChangesRouter(pool));

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });

  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
};

test('rejects a material change with an empty price before querying the database', async (t) => {
  let queryCalled = false;
  const pool = {
    query: async () => {
      queryCalled = true;
      return [[]];
    },
  };
  const server = await startServer(pool);
  t.after(server.close);

  const response = await fetch(`${server.url}/api/materialchangesAPI`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ material_id: 'MAT1', price: '', vendor: 7 }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Material ID, price and vendor are required',
  });
  assert.equal(queryCalled, false);
});
