import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthClientInformationMixed, OAuthClientMetadata, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';

export const CALLBACK_PORT = 8765;
export const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/callback`;

interface Stored {
  client?: OAuthClientInformationMixed;
  tokens?: OAuthTokens;
  tokensSavedAt?: string;
  codeVerifier?: string;
}

/**
 * OAuth for the official Zepto / Swiggy MCP servers, for one local user.
 * Keshav logs in on the app's own page (phone + OTP); this only ever sees the resulting tokens,
 * stored in data/auth/<name>.json with owner-only permissions.
 */
export class FileOAuthProvider implements OAuthClientProvider {
  private readonly path: string;

  constructor(name: string, dataDir = 'data') {
    this.path = join(dataDir, 'auth', `${name}.json`);
  }

  private read(): Stored {
    try {
      return JSON.parse(readFileSync(this.path, 'utf8')) as Stored;
    } catch {
      return {};
    }
  }

  private write(patch: Partial<Stored>): void {
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
    writeFileSync(this.path, JSON.stringify({ ...this.read(), ...patch }, null, 2), { mode: 0o600 });
  }

  get redirectUrl(): string {
    return CALLBACK_URL;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: 'Household grocery compare (personal, localhost)',
      redirect_uris: [CALLBACK_URL],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    };
  }

  clientInformation(): OAuthClientInformationMixed | undefined {
    return this.read().client;
  }
  saveClientInformation(client: OAuthClientInformationMixed): void {
    this.write({ client });
  }
  tokens(): OAuthTokens | undefined {
    return this.read().tokens;
  }
  saveTokens(tokens: OAuthTokens): void {
    this.write({ tokens, tokensSavedAt: new Date().toISOString() });
  }
  redirectToAuthorization(url: URL): void {
    console.log(`\nOpening the login page in your browser. Log in there with your phone number and OTP.\nIf it doesn't open: ${url.href}\n`);
    execFile('open', [url.href]);
  }
  /**
   * When this login stops working without Keshav. Access tokens refresh themselves; what ends a login is the
   * refresh token's lifetime (Swiggy: 30 days, sliding — each refresh re-saves the tokens). Unknown lifetime
   * with a refresh token = no predicted expiry.
   */
  loginExpiry(refreshLifetimeDays?: number): { state: 'ok' | 'expired'; expiresAt?: Date } {
    const { tokens, tokensSavedAt } = this.read();
    if (!tokens) return { state: 'expired' };
    const saved = tokensSavedAt ? new Date(tokensSavedAt).getTime() : Date.now();
    let expiresAt: number | undefined;
    if (tokens.refresh_token) {
      if (refreshLifetimeDays) expiresAt = saved + refreshLifetimeDays * 86_400_000;
    } else if (tokens.expires_in) {
      expiresAt = saved + tokens.expires_in * 1000;
    }
    if (expiresAt !== undefined && expiresAt <= Date.now()) return { state: 'expired', expiresAt: new Date(expiresAt) };
    return { state: 'ok', expiresAt: expiresAt === undefined ? undefined : new Date(expiresAt) };
  }

  /** Forget tokens so the next connect starts a fresh login on the app's own page. */
  forgetTokens(): void {
    this.write({ tokens: undefined, tokensSavedAt: undefined });
  }

  saveCodeVerifier(codeVerifier: string): void {
    this.write({ codeVerifier });
  }
  codeVerifier(): string {
    const v = this.read().codeVerifier;
    if (!v) throw new Error('No PKCE code verifier saved');
    return v;
  }
}

/** Wait for the OAuth redirect on localhost and return the authorization code. */
export function waitForAuthorizationCode(timeoutMs = 5 * 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', CALLBACK_URL);
      if (url.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(code ? '<p>Logged in. You can close this tab.</p>' : `<p>Login failed: ${error ?? 'no code'}</p>`);
      clearTimeout(timer);
      server.close();
      if (code) resolve(code);
      else reject(new Error(`Login failed: ${error ?? 'no code returned'}`));
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new Error('Timed out waiting for login'));
    }, timeoutMs);
    server.listen(CALLBACK_PORT, 'localhost');
  });
}
