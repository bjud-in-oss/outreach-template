/**
 * HASH-INITIERARE FÖR v8.6
 * Beräknar SHA-256 för verify-architecture.js och alla drivrutiner i drivers/, samt sparar i hashes.json.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPTS_DIR = __dirname;
const DRIVERS_DIR = path.join(SCRIPTS_DIR, 'drivers');
const HASHES_FILE = path.join(SCRIPTS_DIR, 'hashes.json');

function computeHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const hashes = {};

// 1. Beräkna hash för huvudskript
const mainScript = path.join(SCRIPTS_DIR, 'verify-architecture.js');
if (fs.existsSync(mainScript)) {
  hashes['verify-architecture.js'] = computeHash(mainScript);
}

// 2. Beräkna hash för alla språkdrivrutiner i drivers/
if (fs.existsSync(DRIVERS_DIR)) {
  for (const file of fs.readdirSync(DRIVERS_DIR)) {
    if (file.endsWith('.js')) {
      const fullPath = path.join(DRIVERS_DIR, file);
      hashes[`drivers/${file}`] = computeHash(fullPath);
    }
  }
}

// 3. Spara automatisk konfiguration
fs.writeFileSync(HASHES_FILE, JSON.stringify(hashes, null, 2), 'utf-8');

console.log('✅ Hashes initierade och sparade i scripts/hashes.json:');
console.log(JSON.stringify(hashes, null, 2));
