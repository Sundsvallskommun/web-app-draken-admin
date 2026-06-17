# Metadata-driven mallselektering — planering (draken-admin)

> Status: förslag/planering · Skapad 2026-06-01 · Repo: **web-app-draken-admin**
> Systerdokument: `web-app-draken-public/docs/template-metadata-refactor.md` (kanonisk datamodell)

## Bakgrund / problem

Mallselekteringen i draken-public är idag en spretig hybrid (identifier-strängbygge +
metadata + `isMEX/isPT/isFT…`-grenar). Vi vill flytta selekteringen till att styras helt av
**metadata**, och då blir admin platsen där den metadatan sätts korrekt och enkelt.

### Brister på admin-sidan idag
- Metadata redigeras i en **rå Monaco JSON-editor**
  (`admin/src/components/edit-resource/edit-resouce-template.component.tsx:221`) — inga fält,
  ingen validering, inga obligatoriska nycklar.
- Inget hindrar t.ex. en Decision-mall utan `decision`-nyckel, eller stavfel som tyst bryter
  selekteringen. `templateType` lagras fritt (Email/email/EMAIL).
- Det finns en **case-audit-sida** (`admin/src/pages/templates/case-audit.tsx`) som i
  efterhand letar efter Decision-mallar som saknar `decision`-nyckel. Det är symptomet:
  vi upptäcker fel istället för att hindra dem.

## Mål för admin

Gör admin **schema-driven**: admins val ska *generera* metadatan automatiskt så de slipper
knappra key/value manuellt — men med en upplåsbar escape-hatch för specialfall.

> Detta gör case-audit-sidan överflödig: vi hindrar fel vid inmatning istället för att
> upptäcka dem efteråt.

## Datamodell

Samma kontrakt som public — se kanonisk definition i
`web-app-draken-public/docs/template-metadata-refactor.md`. Sammanfattning:

- **Två nivåer:** selekteringsfacetter (enumererade, obligatoriska, unika tillsammans) +
  fri informationsmetadata.
- **Ordförråd (`UPPER_SNAKE`):** `Process` (MEX/RPH/FT/RFT), `TemplateType`
  (DECISION/INVESTIGATION/EMAIL/SMS), `Outcome` (APPROVAL/REJECTION/CANCELLATION/DISMISSAL),
  `Capacity` (DRIVER/PASSENGER/ALL), `TemplateRole` (PRIMARY/SIGNATURE/PHRASES/SKELETON).
- **`SELECTION_RULES`:** per `templateType × process` vilka facetter som krävs
  (t.ex. RPH-beslut → `decision` + `capacity`; FT-beslut → `decision`; MEX → inga).

> Konfigen **dupliceras medvetet** mellan repon (inget delat domänpaket finns idag, bara
> `@sk-web-gui/*`). Håll i synk via `SCHEMA_VERSION` + synk-rutin i PR. Public är kanonisk källa.

## Admin-flödet (förpopulering + lås)

```
1. Admin väljer Process (MEX/RPH/FT/RFT)            ─┐
2. Admin väljer TemplateType (Beslut/Utredning/…)   ─┤→ slår upp SELECTION_RULES
3. Formuläret visar exakt de facett-dropdowns regeln kräver
   (RPH-beslut → utfall + kapacitet; FT-beslut → bara utfall; MEX → inga)
4. Valen SKRIVS som metadata-KV automatiskt
   (application/templateType/process/decision/capacity…) — ingen manuell key/value
5. Unikhetskoll: "en mall med dessa facetter finns redan" innan sparning
6. [🔒 Redigera metadata] — upplåsbar rå-JSON för informationsmetadata/specialfall,
   så ingen pillar i onödan men det aldrig är låst på riktigt
```

## Plan för detta repo (admin)

### Steg 4 — Facett-driven form (efter att schema + public-selektering finns)
- Lägg en kopia av schema-modulen, t.ex. `admin/src/config/template-schema.ts`
  (ordförråd + `SELECTION_RULES` + `SCHEMA_VERSION`). Synkas med public.
- Bygg om metadata-delen i `edit-resouce-template.component.tsx`:
  - Strukturerade dropdowns för selekteringsfacetterna, härledda ur `SELECTION_RULES`
    utifrån vald `process` + `templateType`.
  - Valen genererar metadata-KV automatiskt (skriv till samma metadata-array som idag sparas).
  - Behåll Monaco JSON-editorn men **bakom lås** ([🔒 Redigera metadata]) — för
    informationsmetadata och specialfall.
  - Validering: obligatoriska facetter måste fyllas; värden begränsas till enum.
  - Unikhetskoll mot befintliga mallar (samma facett-kombination → varning/blockering).
- Fasa ut `case-audit.tsx` när formuläret hindrar felen den letar efter.

## Öppna frågor / TODO
- [ ] Bekräfta att metadata-arrayen som genereras matchar exakt vad public-selekteringen
      frågar på (nycklar + casing).
- [ ] Hur visa/varna för unikhetskonflikt? (sök mot templating-API innan save)
- [ ] Migrering av befintliga mallar: en "tagga om"-vy eller engångsskript? (backfill)
- [ ] Behåll möjlighet att skapa mallar med custom `templateType` för framtida flöden.
- [ ] Synk-mekanism för schema-modulen mellan repon (SCHEMA_VERSION + ev. CI-checksumma).
- [ ] Jira-epos + PR-uppdelning.

## Relaterat
- `web-app-draken-public/docs/template-metadata-refactor.md` — public-sidan + kanonisk datamodell.
- `api-service-templating` — fritt key/value-metadata (32 teckens nyckellängd, ingen enum);
  validering måste alltså ske i admin.
