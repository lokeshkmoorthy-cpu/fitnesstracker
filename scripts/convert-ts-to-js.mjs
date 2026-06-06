import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  path.join(repoRoot, 'frontend', 'src'),
  path.join(repoRoot, 'backend', 'src'),
  path.join(repoRoot, 'src'),
];

const ROOT_FILES = [
  path.join(repoRoot, 'frontend', 'vite.config.ts'),
  path.join(repoRoot, 'test.ts'),
];

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(full);
    } else if (entry.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
  return files;
}

function fixImportPaths(code) {
  return code
    .replace(/(from\s+['"])([^'"]+?)\.tsx(['"])/g, '$1$2.jsx$3')
    .replace(/(from\s+['"])([^'"]+?)\.ts(['"])/g, '$1$2.js$3')
    .replace(/(import\s+['"])([^'"]+?)\.tsx(['"])/g, '$1$2.jsx$3')
    .replace(/(import\s+['"])([^'"]+?)\.ts(['"])/g, '$1$2.js$3')
    .replace(
      /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
      (match, pre, importPath, post) => {
        if (/\.(js|jsx|json|node|mjs|cjs)$/.test(importPath)) return match;
        return `${pre}${importPath}.js${post}`;
      },
    );
}

function stripDeclareGlobal(code) {
  return code.replace(/declare\s+global\s*\{[\s\S]*?\}\s*/g, '');
}

async function convertFile(filePath) {
  if (filePath.endsWith('.d.ts')) {
    fs.unlinkSync(filePath);
    console.log(`deleted ${path.relative(repoRoot, filePath)}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath);
  const loader = ext === '.tsx' ? 'tsx' : 'ts';

  const result = await esbuild.transform(content, {
    loader,
    format: 'esm',
    target: 'es2022',
    jsx: 'automatic',
    jsxImportSource: 'react',
    tsconfigRaw: {
      compilerOptions: {
        verbatimModuleSyntax: true,
        importsNotUsedAsValues: 'remove',
      },
    },
  });

  let code = stripDeclareGlobal(fixImportPaths(result.code)).trim();

  const newPath = filePath.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js');

  if (!code) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.log(`removed type-only ${path.relative(repoRoot, filePath)}`);
    return;
  }

  fs.writeFileSync(newPath, `${code}\n`);
  if (newPath !== filePath) fs.unlinkSync(filePath);
  console.log(`converted ${path.relative(repoRoot, filePath)} -> ${path.relative(repoRoot, newPath)}`);
}

async function main() {
  const files = new Set();
  for (const dir of TARGET_DIRS) {
    for (const file of walkDir(dir)) files.add(file);
  }
  for (const file of ROOT_FILES) {
    if (fs.existsSync(file)) files.add(file);
  }

  for (const file of [...files].sort()) {
    await convertFile(file);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
