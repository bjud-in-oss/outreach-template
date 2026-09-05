# RUTINER FÖR SKILL- OCH TICKET-ADAPTERING (v9.7)

1. Central ticket-logistik (doc/TICKETS.md)
* Registrera enbart aktiva ärenden (`Open`, `In Progress`) i `doc/TICKETS.md`. Rensa rader med status `Closed` vid cykelavslut i Steg 4.
* Knyt varje ticket till 1 domän under `src/features/` (eller `Global`).

2. Interaktiv Wayfinder & Vektoraktivering
* Formulera i Steg 1a tre fokuserade GROW-frågor ställda mot ändringens faktiska risknoder (`State`, `Contract`, `Effects`, `Resilience`).
* Besvara frågorna i `1b_kartlagga.md` och sätt `"active_vectors"`.
* Driv sekvensen 1b -> 2a -> 2b -> 2e -> 3c linjärt i ett obrutet svep vid active_vectors.length < 2.
* Avsluta Steg 2 i `2e_forsoning_och_forlikning.md` med nyckelordet `MÄTTNAD: JA`.

3. Mänsklig Token-Gate och TDD Exekvering
* Stanna vid Steg 3c, presentera specifikationen och koden från `REQUIRED_TOKEN.txt` i chatten.
* Skapa `doc/LAST_CYCLE/APPROVAL.md` först när användaren bekräftat koden.
* Skapa TDD-tester med aktiva interaktionspåståenden i `src/` före källkodsändringar i Steg 4.
