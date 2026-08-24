# Arkitekturbeslut (ADR) – Huvudlogg

## ADR-001: Feature-Sliced Design & Publika API-gränser
- **Status**: Godkänd & Tillämpas
- **Kontext**: För att eliminera stark sammankoppling och förhindra avvikelser i kontrakt mellan domäner organiseras all domänlogik och alla komponenter under `src/features/[domännamn]/`.
- **Beslut**: Varje domän MÅSTE exponera sina publika förmågor strikt via `src/features/[domännamn]/index.ts`. Direkt djupimport till en annan domäns undermappar är strikt förbjudet.
- **Skivor (Slices)**:
  1. Visuell/UI-skiva (`components/`)
  2. Domän/Logik-skiva (`hooks/`, `domain/`)
  3. Test-skiva (`__tests__/`)
  4. Integration/Gateway-skiva (`api/`, `pwaService.ts`)
  5. Innehåll/i18n-skiva (`translations.ts`, `constants.ts`)
  6. Dokumentationsskiva (`doc/*.md`)

## ADR-002: Tillståndslös exekvering & Minnesarkitektur
- **Status**: Godkänd & Tillämpas
- **Kontext**: Applikationen körs i en containeriserad eller serverlös miljö där disk ej ska användas för okrypterade tillstånd.
- **Beslut**: Inga personuppgifter eller sessions-tokens får skrivas till oskyddad lokal disk. Allt körtidstillstånd förlitar sig på RAM-minne eller säkra molndatabaser.

## ADR-003: Kontraktsdriven verifiering & Förkontroller
- **Status**: Godkänd & Tillämpas
- **Kontext**: Säkerställer 100 % typsäkerhet och hög testtillförlitlighet under byggfasen.
- **Beslut**: Typkontroll (`tsc --noEmit`) och arkitekturverifiering (`npm run verify`) måste gå igenom innan en utvecklingscykel slutförs. Alla domängränssnitt definieras i `domain/types.ts`.

## ADR-004: FSD-lagerseparering & Delad infrastruktur
- **Status**: Godkänd & Tillämpas
- **Kontext**: Icke-UI-infrastruktur och delade verktyg måste hållas separerade från domänspecifik affärslogik.
- **Beslut**: Etablerat en strikt hierarki:
  1. `src/shared/`: Klientsäkra delade typer och hjälpfunktioner bakom `src/shared/index.ts`.
  2. `src/features/`: Rena domänskivor som exporterar sin funktion strikt via `index.ts`.

## ADR-005: Max 120 / 250 rader & Automatisk moduluppdelning
- **Status**: Godkänd & Tillämpas
- **Kontext**: Stora källkodsfiler leder till kognitiv överbelastning, försämrad läsbarhet och token-slöseri vid AI-redigering.
- **Beslut**: UI-vyer (`.tsx` utanför `components/`) begränsas till max 120 rader. Ingen källkodsfil i `src/` får överskrida 250 rader kod.

## ADR-006: Fysiskt processminne (`doc/LAST_CYCLE/`)
- **Status**: Godkänd & Tillämpas
- **Kontext**: När en AI genererar hela sin analys i ett enda chattsvar tenderar den att hoppa över djupgående arkitekturanalys.
- **Beslut**: All planering sker via fysiska filer på disken från 1a till 3c. Fas 2 (kodning) påbörjas först efter bekräftelse i `doc/LAST_CYCLE/APPROVAL.md`.

## ADR-007: AI-Zonering & LLM-isolering
- **Status**: Godkänd & Tillämpas
- **Kontext**: Direktanrop till AI-modeller i UI-komponenter skapar täta kopplingar och säkerhetsrisker.
- **Beslut**: Alla AI-anrop ska isoleras till `src/shared/templates/ai_zones/` (sanitizer, reasoner, executor) eller `src/features/[domän]/domain/ai_zones/`.

## ADR-008: Mekanisk Verifiering med AST-inspektion
- **Status**: Godkänd & Tillämpas
- **Kontext**: Manuella kodgranskningar kan missa strukturella avvikelser och `any`-typer.
- **Beslut**: Skriptet `scripts/verify-architecture.js` körs automatiserat via `npm run verify` för att blockera överträdelser innan byggstopp inträffar.
