import type { MiddlewareHandler } from "hono";
import type { Env } from "./env";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export const basicAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const user = c.env.BASIC_AUTH_USER;
  const pass = c.env.BASIC_AUTH_PASS;
  if (!user || !pass) {
    return c.text("Server missing BASIC_AUTH_USER / BASIC_AUTH_PASS secrets", 500);
  }
  const header = c.req.header("Authorization") ?? "";
  if (!header.startsWith("Basic ")) {
    return c.body(null, 401, {
      "WWW-Authenticate": 'Basic realm="tempus", charset="UTF-8"',
    });
  }
  let decoded = "";
  try {
    decoded = atob(header.slice("Basic ".length).trim());
  } catch {
    return c.body(null, 401, {
      "WWW-Authenticate": 'Basic realm="tempus", charset="UTF-8"',
    });
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) {
    return c.body(null, 401, {
      "WWW-Authenticate": 'Basic realm="tempus", charset="UTF-8"',
    });
  }
  const u = decoded.slice(0, sep);
  const p = decoded.slice(sep + 1);
  if (!timingSafeEqual(u, user) || !timingSafeEqual(p, pass)) {
    return c.body(null, 401, {
      "WWW-Authenticate": 'Basic realm="tempus", charset="UTF-8"',
    });
  }
  await next();
};
