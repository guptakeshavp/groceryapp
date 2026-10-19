// Local web app (spec: runtime — localhost on Keshav's Mac). Run: npm start
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { GroceryApp } from './app.ts';
import { APP_NAMES } from './domain/types.ts';

const PORT = Number(process.env.PORT ?? 4321);
const app = new GroceryApp();
const page = (name = 'index.html') => readFileSync(new URL(`./web/${name}`, import.meta.url), 'utf8');
/** Only BigBasket pages (via the helper bookmark) may post captures to this local app. */
const ASSIST_ORIGIN = 'https://www.bigbasket.com';
const assistCors = {
  'access-control-allow-origin': ASSIST_ORIGIN,
  'access-control-allow-methods': 'POST',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-private-network': 'true',
};

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function send(res: ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(page());
    }
    if (req.method === 'GET' && url.pathname === '/helper') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(page('helper.html'));
    }
    if (url.pathname === '/api/assist/bigbasket') {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, assistCors);
        return res.end();
      }
      if (req.method === 'POST') {
        if (req.headers.origin !== ASSIST_ORIGIN) return send(res, 403, { error: 'captures are accepted from bigbasket.com pages only' });
        const { url: pageUrl, text } = await body(req);
        try {
          return send(res, 200, app.captureBigBasket(String(pageUrl ?? ''), String(text ?? '')), assistCors);
        } catch (e) {
          return send(res, 200, { error: e instanceof Error ? e.message : String(e) }, assistCors);
        }
      }
    }
    if (req.method === 'GET' && url.pathname === '/api/state') {
      return send(res, 200, { deals: app.deals(), notices: await app.notices(), items: app.items(), appNames: APP_NAMES, apps: app.apps(), lastSweep: app.lastSweep });
    }
    if (req.method === 'POST' && url.pathname === '/api/compare') {
      const { text } = await body(req);
      return send(res, 200, await app.compare(String(text ?? '')));
    }
    if (req.method === 'POST' && url.pathname === '/api/candidates') {
      const { query, anyBrand } = await body(req);
      return send(res, 200, await app.candidates(String(query ?? ''), anyBrand === true));
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

// Daily staple checks: shortly after start, then hourly; only staples unchecked for ~24 h are looked up.
const SWEEP_EVERY_MS = 3600_000;
const runSweep = () =>
  app.sweep().then(
    (r) => r && (r.checked || r.skipped.length) && console.log(`Staple check: ${r.checked} checked, ${r.skipped.length} skipped`),
    (e) => console.error('Staple check failed:', e instanceof Error ? e.message : e),
  );
if (process.env.NO_SWEEP !== '1') {
  setTimeout(runSweep, 60_000);
  setInterval(runSweep, SWEEP_EVERY_MS);
}
