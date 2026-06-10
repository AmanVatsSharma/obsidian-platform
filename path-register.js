/**
 * path-register.js — workspace root
 * Maps @obsidian/backend-* aliases to either compiled dist/ output or src/ source.
 *
 * For dev mode (no build): resolves to apps/backend/src/modules/<name>/index.ts
 * For production mode (built): resolves to dist/apps/backend/src/modules/<name>/index.js
 *
 * Note: We use the absolute path form explicitly rather than tsconfig-paths
 * to avoid Windows/path-separator issues.
 */
const path = require('path');

const REPO_ROOT = __dirname;

// Build the dist-based path mapping from tsconfig paths
const fs = require('fs');
const tsconfigPath = path.join(REPO_ROOT, 'tsconfig.base.json');
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
const tsPaths = tsconfig.compilerOptions?.paths ?? {};

const distPaths = {};
const srcPaths = {};
for (const [alias, [srcPattern]] of Object.entries(tsPaths)) {
  srcPaths[alias] = [srcPattern];
  const distPattern = srcPattern.replace(
    'apps/backend/src',
    'dist/apps/backend/src'
  );
  distPaths[alias] = [distPattern];
}

console.log('[path-register] Registering alias paths (dist → src fallback for dev):');
Object.entries(distPaths).slice(0, 5).forEach(([k, v]) => {
  console.log(`  ${k} → ${v[0]}`);
});
console.log(`  ... + ${Object.keys(distPaths).length - 5} more`);

const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

function tryResolvePattern(resolved) {
  if (fs.existsSync(resolved)) return resolved;
  const jsResolved = resolved.replace(/\.ts$/, '.js');
  if (fs.existsSync(jsResolved)) return jsResolved;
  return null;
}

Module._resolveFilename = function(request, parent, isMain, options) {
  // Direct alias match
  const distPath = distPaths[request]?.[0];
  if (distPath) {
    const resolved = path.join(REPO_ROOT, distPath);
    const found = tryResolvePattern(resolved);
    if (found) {
      return originalResolveFilename.call(Module, found, parent, isMain, options);
    }
    // Fall back to src
    const srcPath = srcPaths[request]?.[0];
    if (srcPath) {
      const srcResolved = path.join(REPO_ROOT, srcPath);
      const srcFound = tryResolvePattern(srcResolved);
      if (srcFound) {
        return originalResolveFilename.call(Module, srcFound, parent, isMain, options);
      }
    }
  }
  // Wildcard alias match
  for (const [alias, [pattern]] of Object.entries(distPaths)) {
    if (alias.endsWith('/*') && request.startsWith(alias.slice(0, -2))) {
      const suffix = request.slice(alias.length - 2);
      // Try dist first
      const distResolved = path.join(REPO_ROOT, pattern.replace('apps/backend/src', 'dist/apps/backend/src').replace('*', suffix));
      let found = tryResolvePattern(distResolved);
      if (found) {
        return originalResolveFilename.call(Module, found, parent, isMain, options);
      }
      // Fall back to src
      const srcResolved = path.join(REPO_ROOT, pattern.replace('*', suffix));
      found = tryResolvePattern(srcResolved);
      if (found) {
        return originalResolveFilename.call(Module, found, parent, isMain, options);
      }
    }
  }
  return originalResolveFilename.call(Module, request, parent, isMain, options);
};

console.log('[path-register] Module alias hook registered');
