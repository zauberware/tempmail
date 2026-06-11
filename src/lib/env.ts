export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  POOL_DOMAINS: string;
  BASIC_AUTH_USER?: string;
  BASIC_AUTH_PASS?: string;
}

export function poolDomains(env: Env): string[] {
  return env.POOL_DOMAINS.split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isPoolDomain(env: Env, domain: string): boolean {
  return poolDomains(env).includes(domain.toLowerCase());
}
