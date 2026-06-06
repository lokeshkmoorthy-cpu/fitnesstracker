import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixEsmImportsInDir } from './fix-esm-imports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'backend', 'src');
const dist = path.join(__dirname, '..', 'backend', 'dist');

fixEsmImportsInDir(src);
fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(src, dist, { recursive: true });
