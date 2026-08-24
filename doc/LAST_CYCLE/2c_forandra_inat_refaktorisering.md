# Steg 2c: Förändra inåt (Refaktorisering & Struktur)

## 1. Intern arkitekturförbättring
Tillämpa `codebase-design` eller `improve-codebase-architecture`.

## 2. Åtgärder för modulära gränser
- Håll UI-vyer under 120 rader genom att bryta ut sektioner till `components/`.
- Håll affärslogik i `domain/` och `hooks/`.
- Säkerställ att inga `any`-typer introduceras.
