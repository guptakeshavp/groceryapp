import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { FileOAuthProvider, waitForAuthorizationCode } from './oauth.ts';

export const MCP_SERVERS = {
  zepto: 'https://mcp.zepto.co.in/mcp',
  instamart: 'https://mcp.swiggy.com/im',
} as const;
export type McpApp = keyof typeof MCP_SERVERS;

/**
 * Interactive login: opens the app's own login page in the browser, where Keshav types his phone number
 * and OTP; waits for the localhost redirect and stores the tokens. Returns a connected client.
 */
export async function interactiveLogin(app: McpApp, opts: { dataDir?: string; fresh?: boolean } = {}): Promise<Client> {
  const provider = new FileOAuthProvider(app, opts.dataDir);
  if (opts.fresh) provider.forgetTokens();
  const url = new URL(MCP_SERVERS[app]);
  const client = new Client({ name: 'grocery-compare', version: '0.1.0' });
  const transport = new StreamableHTTPClientTransport(url, { authProvider: provider });
  try {
    await client.connect(transport);
    return client;
  } catch (e) {
    if (!(e instanceof UnauthorizedError)) throw e;
    const code = await waitForAuthorizationCode();
    await transport.finishAuth(code);
    const again = new Client({ name: 'grocery-compare', version: '0.1.0' });
    await again.connect(new StreamableHTTPClientTransport(url, { authProvider: provider }));
    return again;
  }
}
