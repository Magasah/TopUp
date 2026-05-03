import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Корень проекта donater-bot/ */
export const projectRoot = path.join(__dirname, '..');

/**
 * Первый существующий путь из списка (относительные — от корня проекта).
 * @param {(string|undefined|null)[]} candidates
 * @returns {string|null}
 */
export function resolveFirstExisting(candidates) {
  for (const c of candidates) {
    if (!c || typeof c !== 'string') continue;
    const trimmed = c.trim();
    if (!trimmed) continue;
    const p = path.isAbsolute(trimmed)
      ? trimmed
      : path.join(projectRoot, trimmed);
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}
