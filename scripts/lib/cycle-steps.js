import { 
  purgeObsoleteBranchFiles, 
  readActiveVectors, 
  validateCycleSequence, 
  validateTokenGate, 
  runParallelBackgroundChecks 
} from './lib/cycle-steps.js';
import { runTsRules } from './lib/ts-rules.js';

async function main() {
  console.log('🔍 Exekverar verifiering (v9.7)...');

  // 1. Rensa föräldralösa grenfiler
  purgeObsoleteBranchFiles();

  // 2. Validera filsekvens
  const seq = validateCycleSequence();
  if (!seq.valid) {
    console.error(`❌ Sekvensfel: ${seq.error}`);
    process.exit(1);
  }
  console.log(`✅ Sekvens godkänd (${seq.mode}-läge, Vektorer: [${seq.vectors.join(', ')}])`);

  // 3. Exekvera parallella API-kontroller i bakgrunden
  const bg = await runParallelBackgroundChecks(seq.vectors);
  if (bg.executed) {
    console.log(`⚡ Parallella bakgrundskontroller utförda för ${bg.results.length} vektorer.`);
  }

  // 4. Verifiera TypeScript-regler och kompilering
  const tsOk = runTsRules();
  if (!tsOk) {
    console.error('❌ TypeScript-validering misslyckades.');
    process.exit(1);
  }

  console.log('🚀 Verifiering fullbordad utan anmärkningar!');
}

main();
