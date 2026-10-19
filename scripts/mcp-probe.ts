// Early check (spec "Further Notes"): connect to an official MCP server, log in, and list its tools.
// Read-only: it calls no tool at all — no search, no cart, no order.
// Usage: node scripts/mcp-probe.ts zepto|instamart
import { mkdirSync, writeFileSync } from 'node:fs';
import { interactiveLogin, MCP_SERVERS, type McpApp } from '../src/mcp/login.ts';

const name = process.argv[2] ?? '';
if (!(name in MCP_SERVERS)) {
  console.error(`Usage: node scripts/mcp-probe.ts ${Object.keys(MCP_SERVERS).join('|')}`);
  process.exit(2);
}
const client = await interactiveLogin(name as McpApp);
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
