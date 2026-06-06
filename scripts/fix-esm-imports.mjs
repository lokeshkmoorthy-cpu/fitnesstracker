import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function fixEsmImports(code) {
  return code.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, pre, importPath, post) => {
      if (/\.(js|jsx|json|node|mjs|cjs)$/.test(importPath)) return match;
      return `${pre}${importPath}.js${post}`;
    },
  );
}

export function fixEsmImportsInDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixEsmImportsInDir(full);
    } else if (entry.name.endsWith('.js')) {
      const original = fs.readFileSync(full, 'utf8');
      const updated = fixEsmImports(original);
      if (updated !== original) fs.writeFileSync(full, updated);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2] ?? path.join(__dirname, '..', 'backend', 'src');
  fixEsmImportsInDir(path.resolve(target));
  console.log(`Fixed ESM imports in ${target}`);
}
