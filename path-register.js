/**
 * path-register.js — workspace root
 * Maps @obsidian/backend-* aliases to compiled dist/ output at runtime.
 * All NestJS modules are compiled to dist/apps/backend/src/ by `nx build backend`.
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
for (const [alias, [srcPattern]] of Object.entries(tsPaths)) {
  // @obsidian/backend-users → dist/apps/backend/src/modules/users
  // @obsidian/backend/* → dist/apps/backend/src/*
  const distPattern = srcPattern.replace(
    'apps/backend/src',
    'dist/apps/backend/src'
  );
  distPaths[alias] = [distPattern];
}

// Register via Module._resolveAlias if available (Node 22+)
// Otherwise fall back to the paths mapping approach
const distBase = path.join(REPO_ROOT, 'dist', 'apps', 'backend', 'src');
console.log('[path-register] Registering dist-based alias paths:');
Object.entries(distPaths).slice(0, 5).forEach(([k, v]) => {
  console.log(`  ${k} → ${v[0]}`);
});
console.log(`  ... + ${Object.keys(distPaths).length - 5} more`);

// Use require hook approach - patch Module._resolveFilename
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
const originalResolve = Module._resolve;

function resolveAlias(request, parent, isMain, options) {
  // Check if this matches an alias
  for (const [alias, [distPath]] of Object.entries(distPaths)) {
    if (request === alias || request.startsWith(alias + '/')) {
      // Compute the actual dist path
      if (request === alias) {
        const resolved = path.join(REPO_ROOT, distPath);
        if (fs.existsSync(resolved)) {
          return originalResolveFilename.call(Module, resolved, parent, isMain, options);
        }
      } else {
        // Handle sub-paths: @obsidian/backend-users/xyz → dist/.../users/xyz
        const suffix = request.slice(alias.length); // e.g., /users.service
        const resolved = path.join(REPO_ROOT, distPath.replace('*', '')) + suffix + '.js';
        if (fs.existsSync(resolved)) {
          return originalResolveFilename.call(Module, resolved, parent, isMain, options);
        }
      }
    }
  }
  return originalResolveFilename.call(Module, request, parent, isMain, options);
}

Module._resolveFilename = function(request, parent, isMain) {
  // Direct alias match
  const distPath = distPaths[request]?.[0];
  if (distPath) {
    const resolved = path.join(REPO_ROOT, distPath);
    if (fs.existsSync(resolved)) {
      return originalResolveFilename.call(Module, resolved, parent, isMain);
    }
    // Try with .js extension
    const jsResolved = resolved.replace(/\.ts$/, '.js');
    if (fs.existsSync(jsResolved)) {
      return originalResolveFilename.call(Module, jsResolved, parent, isMain);
    }
  }
  // Wildcard alias match
  for (const [alias, [pattern]] of Object.entries(distPaths)) {
    if (alias.endsWith('/*') && request.startsWith(alias.slice(0, -2))) {
      const suffix = request.slice(alias.length - 2); // everything after "backend/"
      const resolved = path.join(REPO_ROOT, pattern.replace('*', suffix));
      if (fs.existsSync(resolved)) {
        return originalResolveFilename.call(Module, resolved, parent, isMain);
      }
      const jsResolved = resolved.replace(/\.ts$/, '.js');
      if (fs.existsSync(jsResolved)) {
        return originalResolveFilename.call(Module, jsResolved, parent, isMain);
      }
    }
  }
  return originalResolveFilename.call(Module, request, parent, isMain);
};

console.log('[path-register] Module alias hook registered');