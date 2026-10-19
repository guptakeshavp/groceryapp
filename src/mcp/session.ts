import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AdapterError } from '../domain/types.ts';
import { FileOAuthProvider } from './oauth.ts';

/**
 * A logged-in connection to an official MCP server that can only call allowlisted tools.
 * Never starts an interactive login: an expired login surfaces as AdapterError('login-expired')
 * and Keshav re-logs in from the "Log in again" button (scripts/mcp-probe.ts for now).
 */
export class McpSession {
  private readonly url: string;
  private readonly provider: FileOAuthProvider;
  private readonly allowed: ReadonlySet<string>;
  private client: Client | undefined;

  private readonly refreshLifetimeDays: number | undefined;

  constructor(opts: { name: string; url: string; allowedTools: string[]; dataDir?: string; refreshLifetimeDays?: number }) {
    this.refreshLifetimeDays = opts.refreshLifetimeDays;
    this.url = opts.url;
    this.provider = new FileOAuthProvider(opts.name, opts.dataDir);
    this.allowed = new Set(opts.allowedTools);
  }

  hasLogin(): boolean {
    return !!this.provider.tokens();
  }

  loginStatus(): { state: 'ok' | 'expired'; expiresAt?: Date } {
    return this.provider.loginExpiry(this.refreshLifetimeDays);
  }

  private async connect(): Promise<Client> {
    if (this.client) return this.client;
    if (this.loginStatus().state === 'expired') throw new AdapterError('login-expired', 'login expired');
    const client = new Client({ name: 'grocery-compare', version: '0.1.0' });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(this.url), { authProvider: this.provider }));
    } catch (e) {
      if (e instanceof UnauthorizedError) throw new AdapterError('login-expired', 'login expired');
      throw new AdapterError('error', e instanceof Error ? e.message : String(e));
    }
    this.client = client;
    return client;
  }

  /** Calls a tool and returns its structured (or JSON text) result. Refuses anything off the allowlist. */
  async call<T>(tool: string, args: Record<string, unknown> = {}): Promise<T> {
    if (!this.allowed.has(tool)) throw new Error(`Refusing to call ${tool}: not on the read-only allowlist`);
    const client = await this.connect();
    let result: Awaited<ReturnType<Client['callTool']>>;
    try {
      result = await client.callTool({ name: tool, arguments: args });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (e instanceof UnauthorizedError || /401|unauthori[sz]ed/i.test(msg)) throw new AdapterError('login-expired', 'login expired');
      if (/429|rate.?limit/i.test(msg)) throw new AdapterError('rate-limited', msg);
      throw new AdapterError('error', msg);
    }
    const text = (result.content as { type: string; text?: string }[] | undefined)?.find((c) => c.type === 'text')?.text;
    if (result.isError) throw new AdapterError('error', `${tool}: ${text ?? 'tool error'}`);
    if (result.structuredContent) return result.structuredContent as T;
    try {
      return JSON.parse(text ?? 'null') as T;
    } catch {
      return text as T;
    }
  }

  async close(): Promise<void> {
    await this.client?.close();
    this.client = undefined;
  }
}
