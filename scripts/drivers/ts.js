/**
 * TYPESCRIPT & FSD DRIVRUTIN (v9.1)
 * Tvingar fram modularisering i UI-komponenter (max 120 rader för huvudvyer),
 * utför prop-/fasadskydd mot förlorade gränssnitt, verifierar interaktionstester,
 * kontrollerar FSD-fasader, AI-isoleringszoner samt TDD-kronologi.
 */
import fs from 'fs';
import path from 'path';

export async function verifyTypeScriptCodebase({
  ROOT_DIR,
  SRC_DIR,
  t3c,
  ignoreMtime,
  logError,
  t4
}) {
  const featuresDir = path.join(SRC_DIR, 'features');
  const LAST_CYCLE_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
  const SNAPSHOT_DIR = path.join(LAST_CYCLE_DIR, 'snapshots', 'pre_step4');
  const p3cPath = path.join(LAST_CYCLE_DIR, '3c_fil_operativ_kallkodsspecifikation.md');
  const p3cContent = fs.existsSync(p3cPath) ? fs.readFileSync(p3cPath, 'utf-8') : '';

  // PROAKTIV DOMÄNKONTROLL I 3C: Kontrollera om specifikationen berör fler än 1 domän
  if (p3cContent) {
    const featureMatches = p3cContent.match(/src\/features\/([a-zA-Z0-9_]+)\//g) || [];
    const domainsIn3c = new Set(featureMatches.map(m => m.split('/')[2]));
    if (domainsIn3c.size > 1) {
      logError('DOMÄNÖVERTRÄDELSE (MAX 1 DOMÄN INOM 3C)', `Specifikationen i 3c berör ${domainsIn3c.size} domäner samtidigt (${Array.from(domainsIn3c).join(', ')}). Dela upp i separata cykler.`);
    }
  }

  if (fs.existsSync(featuresDir)) {
    for (const domain of fs.readdirSync(featuresDir)) {
      const domainPath = path.join(featuresDir, domain);
      if (!fs.statSync(domainPath).isDirectory()) continue;

      const indexPath = path.join(domainPath, 'index.ts');
      if (fs.existsSync(indexPath)) {
        const clean = fs.readFileSync(indexPath, 'utf-8').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
        const invalidLine = clean.split('\n').map(l => l.trim()).filter(Boolean).find(l => !/^(export|import)\b/.test(l));
        if (invalidLine) logError('FASAD-ÖVERTRÄDELSE (ADR-009)', `${path.relative(ROOT_DIR, indexPath)} har otillåten rad: "${invalidLine}"`);
      }

      const sanitizerPath = path.join(domainPath, 'domain', 'ai_zones', 'sanitizer.ts');
      if (fs.existsSync(sanitizerPath)) {
        const content = fs.readFileSync(sanitizerPath, 'utf-8');
        if (/\b(window|document|localStorage|sessionStorage|fetch)\b/.test(content)) {
          logError('SÄKERHETSZON-ÖVERTRÄDELSE', `${path.relative(ROOT_DIR, sanitizerPath)} läcker globala API:er.`);
        }
      }
    }
  }

  if (fs.existsSync(SRC_DIR)) {
    let oldestTestTime = Infinity, oldestProdCodeTime = Infinity;
    let newestProdCodeTime = 0, newestTestTime = 0;
    const modifiedDomains = new Set();

    const scanSrc = (dir) => {
      for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanSrc(fullPath);
        } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const relPath = path.relative(SRC_DIR, fullPath);
          const isTsx = file.endsWith('.tsx');
          const lineCount = content.split('\n').length;
          const isTest = file.includes('__tests__') || file.endsWith('.test.ts') || file.endsWith('.test.tsx');

          const isModifiedAfter3c = !ignoreMtime ? (stat.mtimeMs > t3c) : (p3cContent.includes(relPath) || p3cContent.includes(file));

          if (isModifiedAfter3c && t4 > 0) {
            if (relPath.startsWith('features' + path.sep)) {
              const domName = relPath.split(path.sep)[1];
              if (domName) modifiedDomains.add(domName);
            }

            if (p3cContent && !p3cContent.includes(relPath) && !p3cContent.includes(file)) {
              logError('MANIFESTÖVERTRÄDELSE', `Filen "${relPath}" modifierades i Steg 4 men saknas i 3c. Gör en cykelretur till 3c och speca filen först.`);
            }

            // PROP- OCH FASADSKYDD MOT SNAPSHOT
            const snapFilePath = path.join(SNAPSHOT_DIR, path.basename(fullPath));
            if (fs.existsSync(snapFilePath)) {
              const oldContent = fs.readFileSync(snapFilePath, 'utf-8');
              const oldPropMatches = oldContent.match(/interface\s+[A-Za-z0-9_]*Props[\s\S]*?\}|type\s+[A-Za-z0-9_]*Props\s*=\s*\{[\s\S]*?\}/g) || [];
              const newPropMatches = content.match(/interface\s+[A-Za-z0-9_]*Props[\s\S]*?\}|type\s+[A-Za-z0-9_]*Props\s*=\s*\{[\s\S]*?\}/g) || [];

              if (oldPropMatches.length > 0 && newPropMatches.length > 0) {
                const extractKeys = (str) => (str.match(/\b([a-zA-Z0-9_]+)\s*\??\s*:/g) || []).map(k => k.split('?')[0].split(':')[0].trim());
                const oldKeys = extractKeys(oldPropMatches.join('\n'));
                const newKeys = new Set(extractKeys(newPropMatches.join('\n')));

                const missingKeys = oldKeys.filter(k => !newKeys.has(k) && !['string', 'number', 'boolean', 'any', 'void', 'unknown'].includes(k));
                if (missingKeys.length > 0 && !/BORTTAGEN_PROP|REFAKTORISERAD_PROP/i.test(p3cContent)) {
                  logError('GRÄNSSNITTSREGRESSION (PROP-LÄCKAGE)', `${path.relative(ROOT_DIR, fullPath)} förlorade prop/interface-nycklar: (${missingKeys.join(', ')}) utan "BORTTAGEN_PROP" i 3c.`);
                }
              }
            }
          }

          if (!ignoreMtime && stat.mtimeMs <= t3c) {
            logError('SEKVENSFEL', `Källkodsfilen "${path.relative(ROOT_DIR, fullPath)}" sparades FÖRE 3c.`);
          }

          const hasAiImport = /(@google\/genai|openai|fetch\(['"]\/api\/ai)/i.test(content);
          const isInsideAiZone = relPath.includes(`domain${path.sep}ai_zones`) || relPath.includes(`shared${path.sep}templates${path.sep}ai_zones`);
          const isServerCode = path.relative(ROOT_DIR, fullPath).startsWith('server');

          if (hasAiImport && !isInsideAiZone && !isServerCode) {
            logError('AI-ISOLERINGSÖVERTRÄDELSE', `${path.relative(ROOT_DIR, fullPath)} innehåller AI-anrop utanför domain/ai_zones/ eller src/shared/templates/ai_zones/.`);
          }

          if (isTsx && !isTest) {
            const useStateCount = (content.match(/useState\s*\(/g) || []).length;
            const useEffectCount = (content.match(/useEffect\s*\(/g) || []).length;

            if (useStateCount + useEffectCount > 3) {
              logError('Snyggar till: För mycket logik i samma vy', `${path.relative(ROOT_DIR, fullPath)} har ${useStateCount + useEffectCount} hooks. Bryt ut beräkningarna till en custom hook under hooks/.`);
            }

            if (/fetch\s*\(|async\s+\(|axios\./.test(content)) {
              logError('Prestanda: Datahämtning i gränssnittet', `${path.relative(ROOT_DIR, fullPath)} hämtar data direkt i vyn. Flytta till domain/ eller servicelagret.`);
            }

            // STRIKT MODULARISERINGSGRÄNS FÖR UI: Max 120 rader för huvudvyer
            if (lineCount > 120 && !relPath.includes(`components${path.sep}`)) {
              logError('MODULARISERINGSGRÄNS ÖVERSKRIDEN', `${path.relative(ROOT_DIR, fullPath)} har ${lineCount} rader. UI-vyer får ha max 120 rader. Bryt ut sektioner till fristående underkomponenter i components/.`);
            }
          }

          if (isTest) {
            const hasExpect = /expect\s*\(/.test(content);
            if (!hasExpect) {
              logError('TEST UTAN ASSERTIONS', `${path.relative(ROOT_DIR, fullPath)} saknar expect()-påståenden.`);
            }

            if (file.endsWith('.test.tsx')) {
              const hasInteraction = /(fireEvent|userEvent|toHaveBeenCalled|getByRole|getByText|click)\b/.test(content);
              if (!hasInteraction) {
                logError('GRÄNSSNITTSTEST UTAN INTERAKTION', `${path.relative(ROOT_DIR, fullPath)} är ett UI-test men saknar interaktionspåståenden (fireEvent/userEvent/toHaveBeenCalled).`);
              }
            }
          }

          if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(content)) {
            logError('Felhantering: Dolda fel i koden', `${path.relative(ROOT_DIR, fullPath)} har ett tomt catch-block som sväljer fel.`);
          }

          if (/: \s*any\b|as\s+any\b/.test(content)) {
            logError('Typkontroll: Koden saknade tydliga beskrivningar av sin data', `${path.relative(ROOT_DIR, fullPath)} använder 'any'. Ange konkreta datatyper.`);
          }

          if (isTest) {
            if (stat.mtimeMs < oldestTestTime) oldestTestTime = stat.mtimeMs;
            if (stat.mtimeMs > newestTestTime) newestTestTime = stat.mtimeMs;
          } else {
            if (stat.mtimeMs < oldestProdCodeTime) oldestProdCodeTime = stat.mtimeMs;
            if (stat.mtimeMs > newestProdCodeTime) newestProdCodeTime = stat.mtimeMs;
          }

          if (lineCount > 250) {
            logError('STORLEKSGRÄNS ÖVERSKRIDEN', `${path.relative(ROOT_DIR, fullPath)} överstiger 250 rader.`);
          }

          if (/(from\s+['"][^'"]*\/features\/[^/]+\/(components|hooks|api|domain|doc)\/|from\s+['"]\.\.\/\.\.\/)/.test(content)) {
            logError('FSD-ÖVERTRÄDELSE', `${path.relative(ROOT_DIR, fullPath)} importerar internt eller kliver bakåt.`);
          }
        }
      }
    };

    scanSrc(SRC_DIR);

    if (t4 > 0 && modifiedDomains.size > 1) {
      logError('DOMÄNÖVERTRÄDELSE (MAX 1 DOMÄN)', `Ändringar upptäcktes i ${modifiedDomains.size} domäner samtidigt (${Array.from(modifiedDomains).join(', ')}). Dela upp i separata cykler.`);
    }

    if (t4 > 0 && newestProdCodeTime <= t3c && newestTestTime <= t3c && !ignoreMtime) {
      logError('TOM PRODUKTION', '4_producera.md skapades men inga källkods- eller testfiler i src/ har ändrats efter 3c.');
    }

    if (!ignoreMtime && oldestProdCodeTime !== Infinity && oldestTestTime !== Infinity && oldestTestTime > oldestProdCodeTime) {
      logError('TDD-ÖVERTRÄDELSE', 'Produktionskod påbörjades innan några enhetstester skapats.');
    }

    if (!ignoreMtime && t4 > 0 && t4 <= newestProdCodeTime) {
      logError('SEKVENSFEL', '4_producera.md sparades innan all källkod var färdigskriven.');
    }
  }
}