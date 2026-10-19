// Early check (spec "Further Notes"): connect to an official MCP server, log in, and list its tools.
// Read-only: it calls no tool at all — no search, no cart, no order.
// Usage: node scripts/mcp-probe.ts zepto|instamart
import { mkdirSync, writeFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { FileOAuthProvider, waitForAuthorizationCode } from '../src/mcp/oauth.ts';

const SERVERS: Record<string, string> = {
  zepto: 'https://mcp.zepto.co.in/mcp',
  instamart: 'https://mcp.swiggy.com/im',
};

const name = process.argv[2] ?? '';
const serverUrl = SERVERS[name];
if (!serverUrl) {
  console.error(`Usage: node scripts/mcp-probe.ts ${Object.keys(SERVERS).join('|')}`);
  process.exit(2);
}

const provider = new FileOAuthProvider(name);
const newClient = () => new Client({ name: 'grocery-compare-probe', version: '0.1.0' });

async function connect(): Promise<Client> {
  const client = newClient();
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), { authProvider: provider });
  try {
    await client.connect(transport);
    return client;
  } catch (e) {
    if (!(e instanceof UnauthorizedError)) throw e;
    console.log('Waiting for you to finish logging in…');
    const code = await waitForAuthorizationCode();
    await transport.finishAuth(code);
    const again = newClient();
    await again.connect(new StreamableHTTPClientTransport(new URL(serverUrl), { authProvider: provider }));
    return again;
  }
}

const client = await connect();
const { tools } = await client.listTools();
mkdirSync('data/probe', { recursive: true });
writeFileSync(`data/probe/${name}-tools.json`, JSON.stringify(tools, null, 2));
console.log(`\nConnected to ${name}. ${tools.length} tools (full schemas in data/probe/${name}-tools.json):`);
for (const t of tools) {
  const params = Object.keys((t.inputSchema as { properties?: object }).properties ?? {});
  const write = t.annotations?.readOnlyHint === false || t.annotations?.destructiveHint ? ' [writes]' : '';
  console.log(`- ${t.name}(${params.join(', ')})${write}: ${(t.description ?? '').replace(/\s+/g, ' ').slice(0, 140)}`);
}
await client.close();
