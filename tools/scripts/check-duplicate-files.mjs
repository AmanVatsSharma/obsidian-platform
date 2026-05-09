import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const scanRoots = ['apps/backend/src/modules', 'apps/backend/src/shared', 'apps/backend/src/common'];
const ignoreExact = new Set(['index.ts', 'project.json', 'MODULE_DOC.md']);
const ignoreSuffix = ['.spec.ts', '.test.ts'];

/**
 * Recursively collects all files under a folder.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(fullPath));
    } else {
      out.push(fullPath);
    }
  }
  return out;
}

/**
 * Returns whether a file should be ignored from duplicate checks.
 * @param {string} filename
 * @returns {boolean}
 */
function isIgnored(filename) {
  if (ignoreExact.has(filename)) return true;
  return ignoreSuffix.some((suffix) => filename.endsWith(suffix));
}

const byFileName = new Map();
for (const root of scanRoots) {
  const absRoot = path.join(workspaceRoot, root);
  const files = collectFiles(absRoot);
  for (const file of files) {
    const name = path.basename(file);
    if (isIgnored(name)) continue;
    if (!byFileName.has(name)) byFileName.set(name, []);
    byFileName.get(name).push(path.relative(workspaceRoot, file));
  }
}

const duplicates = [...byFileName.entries()].filter(([, paths]) => paths.length > 1);
if (duplicates.length > 0) {
  process.stderr.write('Duplicate filename check failed. Resolve duplicated files:\n');
  for (const [name, paths] of duplicates) {
    process.stderr.write(`\n- ${name}\n`);
    for (const filePath of paths) {
      process.stderr.write(`  - ${filePath}\n`);
    }
  }
  process.exit(1);
}

process.stdout.write('Duplicate filename check passed.\n');
