// Local web app (spec: runtime — localhost on Keshav's Mac). Run: npm start
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { GroceryApp } from './app.ts';
import { APP_NAMES } from './domain/types.ts';

const PORT = Number(process.env.PORT ?? 4321);
const app = new GroceryApp();
const page = () => readFileSync(new URL('./web/index.html', import.meta.url), 'utf8');

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function send(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(page());
    }
    if (req.method === 'GET' && url.pathname === '/api/state') {
      return send(res, 200, { deals: app.deals(), notices: await app.notices(), items: app.items(), appNames: APP_NAMES });
    }
    if (req.method === 'POST' && url.pathname === '/api/compare') {
      const { text } = await body(req);
      return send(res, 200, await app.compare(String(text ?? '')));
    }
    if (req.method === 'POST' && url.pathname === '/api/candidates') {
      const { query } = await body(req);
      return send(res, 200, await app.candidates(String(query ?? '')));
    }
    if (req.method === 'POST' && url.pathname === '/api/items') {
      return send(res, 200, app.saveItem((await body(req)) as unknown as Parameters<GroceryApp['saveItem']>[0]));
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 500, { error: e instanceof Error ? e.message : String(e) });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`Grocery compare: http://localhost:${PORT}`));
