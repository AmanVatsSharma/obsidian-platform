/**
 * File:        apps/web/shared/providers/auth-dev-prompt.ts
 * Module:      web · shared · providers
 * Purpose:     Node-only interactive password prompt used by the DEV LOGIN
 *              flow. Lives in its own file so Next.js' client bundle never
 *              statically imports `readline` / `fs` — the client import path
 *              `shared/providers/auth-provider.tsx` is supposed to ship to
 *              the browser, and pulling Node built-ins there triggers a
 *              "Module not found: Can't resolve 'fs'" webpack error.
 *
 * Exports:     promptDevPassword — async; returns the password string.
 * Side-effects: Reads from stdin, writes to stdout (Node only).
 * Key-invariants:
 *   - Only safe to call from a Node.js process (server runtime, dev script).
 *   - Never bundled into the client — auth-provider imports this module
 *     via a dynamic `import()` inside an `if (typeof window === 'undefined')`
 *     guard, so the static analyzer skips it on the client build.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

export async function promptDevPassword(): Promise<string> {
  // `readline` and `process.stdin` are Node built-ins. This module must
  // never be reachable from a browser bundle.
  const readLine = await import('readline');

  return new Promise<string>((resolve) => {
    const rl = readLine.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('[DEV LOGIN] Enter password: ', (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}
