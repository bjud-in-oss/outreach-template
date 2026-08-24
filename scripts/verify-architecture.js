/**
 * DETERMINISTISK PROCESS- OCH KODREVISOR (v9.1)
 * SHA-256-hashkontroll, mtime-tidsspärr, automatisk städning av APPROVAL.md,
 * Mänsklig Input-Gate (2s betänketid), automatisk fil-snapshot före Steg 4,
 * automatisk drivrutinsdetektering.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DOC_DIR = path.join(ROOT_DIR, 'doc');
const LAST_CYCLE_DIR = path.join(DOC_DIR, 'LAST_CYCLE');
const SNAPSHOT_DIR = path.join(LAST_CYCLE_DIR, 'snapshots', 'pre_step4');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const HASHES_FILE = path.join(__dirname, 'hashes.json');
const INIT_HASHES_FILE = path.join(__dirname, 'init-hashes.js');

const ignoreMtime = process.argv.includes('--ignore-mtime') || process.argv.includes('--fresh-clone');
let hasErrors = false;

function logError(title, message) {
  console.error(`\n❌ [MEKANISK SPÄRR v9.1] ${title}`);
  console.error(`   ${message}`);
  hasErrors = true;
}

function getMtime(filePath) {
  return fs.existsSync(filePath) ? fs.statSync(filePath).mtimeMs : 0;
}

function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
}

function computeHash(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function detectLanguageDriver() {
  if (fs.existsSync(path.join(ROOT_DIR, 'go.mod'))) return 'go';
  if (fs.existsSync(path.join(ROOT_DIR, 'Cargo.toml'))) return 'rust';
  if (fs.existsSync(path.join(ROOT_DIR, 'pyproject.toml')) || fs.existsSync(path.join(ROOT_DIR, 'requirements.txt'))) return 'python';
  return 'ts';
}

function createPreStep4Snapshots(p3cContent) {
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
    const matches = p3cContent.match(/`([^`]+\.(tsx?|jsx?))`|([a-zA-Z0-9_\-\/]+\.(tsx?|jsx?))/g) || [];
    for (const match of matches) {
      const cleanPath = match.replace(/`/g, '').trim();
      const fullSrcPath = path.isAbsolute(cleanPath) ? cleanPath : path.join(SRC_DIR, cleanPath.replace(/^src\//, ''));
      if (fs.existsSync(fullSrcPath) && fs.statSync(fullSrcPath).isFile()) {
        const destPath = path.join(SNAPSHOT_DIR, path.basename(fullSrcPath));
        fs.copyFileSync(fullSrcPath, destPath);
      }
    }
  } catch (e) {
    // Tyst snapshot om inget fanns tidigare
  }
}

async function runVerification() {
  if (!fs.existsSync(LAST_CYCLE_DIR)) {
    logError('PROCESSMINNE SAKNAS', 'Mappen "doc/LAST_CYCLE/" saknas.');
    process.exit(1);
  }

  const driverLang = detectLanguageDriver();
  const driverPath = path.join(__dirname, 'drivers', `${driverLang}.js`);

  const p1a = path.join(LAST_CYCLE_DIR, '1a_orientera.md');
  const p1b = path.join(LAST_CYCLE_DIR, '1b_kartlagga.md');
  const p3c = path.join(LAST_CYCLE_DIR, '3c_fil_operativ_kallkodsspecifikation.md');
  const pApproval = path.join(LAST_CYCLE_DIR, 'APPROVAL.md');

  const t1a = getMtime(p1a), t1b = getMtime(p1b), t3c = getMtime(p3c);
  let tApproval = getMtime(pApproval);

  // AUTOMATISK NOLLSTÄLLNING: Om ny cykel startat ELLER om 3c sparas om, radera gammalt kvitto
  if (tApproval > 0 && (tApproval < t1a || tApproval < t3c)) {
    try {
      fs.unlinkSync(pApproval);
      tApproval = 0;
    } catch (e) {}
  }

  const tScript = getMtime(__filename);
  const tDriver = getMtime(driverPath);
  const tHashes = getMtime(HASHES_FILE);
  const tInitHashes = getMtime(INIT_HASHES_FILE);

  if (t1a === 0 || t1b === 0) logError('STEG 1 SAKNAS', '1a_orientera.md eller 1b_kartlagga.md saknas.');
  if (!ignoreMtime && t1b <= t1a) logError('SEKVENSFEL', '1b_kartlagga.md måste sparas strikt EFTER 1a_orientera.md.');

  if (!ignoreMtime && t1a > 0) {
    if (tScript > t1a) logError('SKRIPTMANIPULERING', 'scripts/verify-architecture.js har redigerats under pågående cykel.');
    if (tDriver > t1a) logError('DRIVRUTINSMANIPULERING', `scripts/drivers/${driverLang}.js har redigerats under pågående cykel.`);
    if (tHashes > t1a || tInitHashes > t1a) logError('HASHMANIPULERING', 'hashes.json eller init-hashes.js har ändrats/körts under pågående cykel.');
  }

  if (fs.existsSync(HASHES_FILE)) {
    try {
      const storedHashes = JSON.parse(readFile(HASHES_FILE));
      const currentScriptHash = computeHash(__filename);
      const currentDriverHash = computeHash(driverPath);

      if (storedHashes['verify-architecture.js'] && storedHashes['verify-architecture.js'] !== currentScriptHash) {
        logError('SKRIPTMANIPULERING (SHA-256)', 'scripts/verify-architecture.js stämmer inte överens med sparat SHA-256-fingeravtryck.');
      }
      if (storedHashes[`drivers/${driverLang}.js`] && storedHashes[`drivers/${driverLang}.js`] !== currentDriverHash) {
        logError('DRIVRUTINSMANIPULERING (SHA-256)', `scripts/drivers/${driverLang}.js stämmer inte överens med sparat SHA-256-fingeravtryck.`);
      }
    } catch (e) {
      logError('HASH-KONTROLLMISSLYCKANDE', 'Kunde inte läsa eller tolka scripts/hashes.json.');
    }
  }

  if (t1a > 0) {
    const jsonMatch = readFile(p1a).match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      logError('FORMATFEL (ADR-010)', '1a_orientera.md saknar giltigt ```json ... ```-block.');
    } else {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (!parsed.status || !parsed.current_domain || !parsed.next_step) logError('FORMATFEL (ADR-010)', 'JSON-blocket saknar obligatoriska nycklar.');
      } catch (e) {
        logError('JSON-PARSE-FEL (ADR-010)', 'JSON-blocket i 1a_orientera.md kunde inte tolkas.');
      }
    }
  }

  const p2a = path.join(LAST_CYCLE_DIR, '2a_forandra_utat_vision.md');
  const p2b = path.join(LAST_CYCLE_DIR, '2b_evaluera_yttre_anpassning.md');
  const p2c = path.join(LAST_CYCLE_DIR, '2c_forandra_inat_refaktorisering.md');
  const p2d = path.join(LAST_CYCLE_DIR, '2d_evaluera_inre_struktur.md');
  const p2e = path.join(LAST_CYCLE_DIR, '2e_forsoning_och_forlikning.md');
  const p2f = path.join(LAST_CYCLE_DIR, '2f_evaluera_syntes.md');

  const t2a = getMtime(p2a), t2b = getMtime(p2b), t2c = getMtime(p2c);
  const t2d = getMtime(p2d), t2e = getMtime(p2e);

  if (t2c === 0) logError('MÅSTE KÖRA 2C', 'Steg 2c är tvingande för att förhindra arkitekturskuld.');

  if (!ignoreMtime) {
    if (t2a <= t1b) logError('SEKVENSFEL', '2a måste sparas EFTER 1b.');
    if (t2b <= t2a) logError('SEKVENSFEL', '2b måste sparas EFTER 2a.');
    if (t2c <= t2b) logError('SEKVENSFEL', '2c måste sparas EFTER 2b.');
    if (t2d <= t2c) logError('SEKVENSFEL', '2d måste sparas EFTER 2c.');
  }

  let strategyPassedTime = 0;
  if (/BESLUT:\s*GÅ_TILL_DESIGN/i.test(readFile(p2d))) {
    strategyPassedTime = t2d;
  } else {
    if (!ignoreMtime) {
      if (t2e <= t2d) logError('SEKVENSFEL', '2e måste sparas EFTER 2d.');
    }
    if (fs.existsSync(p2e) && /(tvärdomän|bibliotek|säkerhetsregler|kontrakt|adr)/i.test(readFile(p2e))) {
      if (!ignoreMtime && getMtime(path.join(DOC_DIR, 'ADR.md')) <= t2e) logError('DOKUMENTATIONSSKULD', '2e kräver en ADR-uppdatering.');
    }
    if (/BESLUT:\s*GÅ_TILL_DESIGN/i.test(readFile(p2f))) strategyPassedTime = getMtime(p2f);
    else logError('STRATEGISK SPÄRR', 'Inget "BESLUT: GÅ_TILL_DESIGN" nåddes i Steg 2.');
  }

  const p3a = path.join(LAST_CYCLE_DIR, '3a_helhet_orkestrering_och_integration.md');
  const p3b = path.join(LAST_CYCLE_DIR, '3b_doman_kontrakt_och_fraktal_dokumentation.md');
  const t3a = getMtime(p3a), t3b = getMtime(p3b);

  if (!ignoreMtime) {
    if (t3a <= strategyPassedTime) logError('SEKVENSFEL', '3a måste sparas EFTER Steg 2-godkännandet.');
    if (t3b <= t3a) logError('SEKVENSFEL', '3b måste sparas EFTER 3a.');
    if (t3c <= t3b) logError('SEKVENSFEL', '3c måste sparas EFTER 3b.');
  }

  if (!(t3c > 0 && /BESLUT:\s*GODKÄND/i.test(readFile(p3c)))) logError('DOMSTOLSSPÄRR', '3c saknar "BESLUT: GODKÄND".');

  if (t3c > 0) {
    if (tApproval === 0) {
      logError('MÄNSKLIGT GODKÄNNANDE SAKNAS', 'Källkod får inte redigeras. Granska 3c och spara doc/LAST_CYCLE/APPROVAL.md för att låsa upp Steg 4.');
    } else if (!ignoreMtime && tApproval <= t3c) {
      logError('SEKVENSFEL (APPROVAL)', 'APPROVAL.md sparades FÖRE eller SAMTIDIGT som 3c. Filen måste sparas EFTER att 3c granskats.');
    } else if (!ignoreMtime && (tApproval - t3c) < 2000) {
      logError('AUTOMATISERAT GODKÄNNANDE UPPTÄCKT', `APPROVAL.md skapades endast ${Math.round((tApproval - t3c)/1000)}s efter 3c. Mänsklig granskning krävs (minst 2s betänketid).`);
    } else {
      createPreStep4Snapshots(readFile(p3c));
    }
  }

  if (fs.existsSync(driverPath)) {
    const driverModule = await import(`./drivers/${driverLang}.js`);
    const verifyFunc = driverModule.verifyCodebase || driverModule.verifyTypeScriptCodebase;
    await verifyFunc({
      ROOT_DIR,
      SRC_DIR: path.join(ROOT_DIR, 'src'),
      t3c,
      ignoreMtime,
      logError,
      p4Path: path.join(LAST_CYCLE_DIR, '4_producera.md'),
      t4: getMtime(path.join(LAST_CYCLE_DIR, '4_producera.md'))
    });
  } else {
    logError('DRIVRUTIN SAKNAS', `Drivrutinen scripts/drivers/${driverLang}.js saknas.`);
  }

  if (hasErrors) {
    console.error('\n⛔ BYGGET STOPPADES AV MEKANISK KONTROLL v9.1.\n');
    process.exit(1);
  } else {
    console.log(`✅ Alla sekvenser, fasader, max-domänsgränser, AI-zoner, Mänsklig Gate och TDD-kronologier godkända [Drivrutin: ${driverLang}] (v9.1).`);
  }
}

runVerification();