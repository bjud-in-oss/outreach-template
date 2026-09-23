# RUTINER FÖR SKILL- OCH TICKET-ADAPTERING (AGENTS.md v9.9)

1. Central ticket-logistik (doc/TICKETS.md)
* Registrera enbart aktiva ärenden (`Open`, `In Progress`) i `doc/TICKETS.md`. Rensa rader med status `Closed` vid cykelavslut i Steg 4.
* Knyt varje ticket till 1 domän under `src/features/` (eller `Global`).

2. Tregradig Agentdynamik (Följa, Vända om, Förlikas)
* Att följa (Steg 1a–1b): Formulera i Steg 1a tre fokuserade risknoder (`State`, `Contract`, `Resilience`). Besvara och lös dem internt i `1b_kartlagga.md` och `2e_syntetisera.md`, sätt `"active_vectors"` och driv kedjan $1b \rightarrow 2a \rightarrow 2b \rightarrow 2e \rightarrow 3c$ linjärt i ett obrutet svep.
* Att vända om (Terminal & API): Exekvera `npm run verify` i terminalen för att köra parallella granskningar via Gemini API. Låt bakgrundsskriptet validera kontrakt, resiliens och gränssnitt oberoende av chattens kontext.
* Att förlikas (Steg 2e–3c & Token Gate): Avsluta Steg 2 i `2e_syntetisera.md` med nyckelordet `MÄTTNAD: JA` när alla målkonflikter lösts. Stanna vid Steg 3c, översätt den tekniska specifikationen till användarnytta och systembeteende i chatten samt presentera koden från `REQUIRED_TOKEN.txt`.

3. Dubbel Teststrategi och Fraktal Dokumentation (Fas 2 / Steg 4)
* Skapa `doc/LAST_CYCLE/APPROVAL.md` när användaren bekräftat koden i chatten.
* Logga principiella systemövergripande beslut (ADR) i `doc/DECISIONS.md`. Domänspecifika affärsregler dokumenteras lokalt i `src/features/[modul]/doc/`.
* Skapa isolerade offline-enhetstester (`pnpm test`) med aktiva interaktionspåståenden i `src/__tests__/` före källkodsändringar.
* **Vid ändring av autentisering, WebSocket eller API:** Exekvera skarpa live-tester (`pnpm test:live`) mot riktiga gränssnitt enligt ADR-018. Redovisa nätverksstatus eller saknade nycklar direkt i diagnostiken.

4. Aktiva Skills och Delade Moduler (JIT)
* Läs in `gemini-api-dev` eller `gemini-live-api-dev` från `doc/skills/` eller `~/.agents/skills/` enbart när motsvarande `active_skill` deklareras i Steg 1b.
*
