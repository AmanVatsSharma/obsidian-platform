/**
 * path-register.js — workspace root
 * Registered via --require before the NestJS backend starts.
 * Maps @obsidian/backend-* path aliases to their source locations in apps/backend/src/.
 *
 * Implementation note: loads from tsconfig.base.json directly (not explicit paths)
 * because tsconfig-paths' explicit paths mode has a subtle bug where the implicit
 * wildcard (added when addMatchAll=true) resolves relative to baseUrl as a directory
 * path rather than the tsconfig-relative path. Loading from tsconfig.base.json uses
 * the already-resolved absolute paths from tsconfig-paths, which work correctly.
 */
const { register, loadConfig } = require('tsconfig-paths');
const path = require('path');

const REPO_ROOT = __dirname;

// Load the full tsconfig chain from tsconfig.base.json — tsconfig-paths resolves
// paths correctly when loaded from a file (absolute paths), but not with explicit
// baseUrl (relative paths get wrong wildcard resolution).
const tsconfigPath = path.join(REPO_ROOT, 'tsconfig.base.json');
const { absoluteBaseUrl, paths } = loadConfig(tsconfigPath);

if (!absoluteBaseUrl || !paths) {
  throw new Error(
    `[path-register] Failed to load tsconfig paths from ${tsconfigPath}. ` +
    `absoluteBaseUrl=${absoluteBaseUrl}, paths=${paths}`
  );
}

register({
  // absoluteBaseUrl from tsconfig-paths is already resolved to the repo root
  baseUrl: absoluteBaseUrl,
  // Use paths directly from tsconfig-paths — they are already absolute-compatible
  paths,
});