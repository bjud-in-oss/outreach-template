# RUTINER FÖR SKILL- OCH TICKET-ADAPTERING (SI v9.3)

## 1. Central ticket-logistik (doc/TICKETS.md)
* Skapa eller uppdatera alltid `doc/TICKETS.md` i Steg 1a (Orientera).
* Sätt `ticket_type` till en av: "Task", "Research", "Prototype" eller "Grilling".
* Sätt `status` till "Open", "In Progress" eller "Closed".
* Knyt varje ticket till exakt 1 domän under `src/features/` (eller "Global" för tvärgående Research och Arkitektur).

## 2. JIT-inläsning av färdigheter per fas
Skanna och applicera relevanta färdigheter från `doc/skills/mattpocock/skills/` i processens steg:
* **Steg 1a–1b (Orientera & Kartlägga):** Tillämpa analys-skills (wayfinder, triage, research, grilling). Logga den aktiva färdigheten i `1a_orientera.md` JSON-blocket under nyckeln "active_skill".
* **Steg 2a–2f (Förändra utåt, Förändra inåt & Försoning):** Tillämpa `codebase-design` eller `improve-codebase-architecture` under Steg 2c (Förändra inåt) för strukturell utvärdering och refaktorisering.
* **Steg 3a–3c (Helhet, Fraktalitet & Operativ Specifikation):** Tillämpa `to-spec` i Steg 3c. Lista exakta relativa filvägar för berörda källkods- eller artefaktfiler för att aktivera automatisk snapshotting.
* **Steg 4 (Producera):** Tillämpa `tdd` och `implement`. Skapa alla testfiler med aktiva interaktionspåståenden (`fireEvent`, `userEvent`, `click`, `toHaveBeenCalled`) i `src/` innan produktionskoden skrivs.

## 3. JSON-deklaration i Steg 1a (ADR-010 Compliance)
Inkludera alltid samtliga fem nycklar i `1a_orientera.md`:
```json
{
  "status": "IN_PROGRESS",
  "current_domain": "exempel_doman",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-001",
  "active_skill": "wayfinder"
}
```

## 4. Anpassning för icke-kodande tickets (Research & Grilling)
- Behandla den analyserade kunskapen eller beslutsunderlaget i Steg 3c som den slutgiltiga artefakten vid Research och Grilling.
- Avsluta cykeln direkt vid Steg 3c genom att sätta "BESLUT: GODKÄND" i 3c och uppdatera status till "Closed" i `doc/TICKETS.md`.

## 5. Källkods- och Arkitekturregler
- **FSD-hierarki**: All domänfunktionalitet under `src/features/[domän]/`. Endast publika gränssnitt exporteras via `src/features/[domän]/index.ts`.
- **Maxgränser**: Max 120 rader per UI-vy (`.tsx` utanför `components/`). Max 250 rader per källkodsfil.
- **AI-Isolering**: Alla klient- och serverbaserade AI-anrop isoleras till `src/shared/templates/ai_zones/` eller `domain/ai_zones/`. Inga direkta AI-biblioteksimporter i UI-komponenter.
- **Mekanisk Verifiering**: Kör alltid `npm run verify` för att bekräfta att arkitekturregler, stegfiler och tester efterlevs.
