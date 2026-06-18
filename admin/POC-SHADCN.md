# Draken Admin – shadcn/ui

Frontend byggd med [shadcn/ui](https://ui.shadcn.com) (Radix UI + Tailwind). På branchen
`poc/shadcn` har **@sk-web-gui ersatts helt** av shadcn — det är nu appens enda designsystem.

## Köra

```bash
yarn dev      # http://localhost:3002 (kräver inloggning mot backend)
yarn build    # produktionsbygge
```

Appen körs bakom `LoginGuard` mot samma backend som tidigare (`NEXT_PUBLIC_API_URL`),
så logga in som vanligt för att se riktig data.

## Struktur

- **Tema:** `tailwind.config.js` (shadcn-tema) + CSS-variabler i `src/styles/tailwind.scss`.
- **Providers:** `src/layouts/app/app-layout.component.tsx` – next-themes (ljus/mörk) + `LoginGuard` + global `Toaster` (sonner).
- **Skal/sidor:** `src/poc/` (layout, sidebar, generisk tabell/formulär, etikett-träd, schema-builder, Monaco-fält). Rutter under `src/pages/`.
- **Komponenter:** `src/components/ui/*` (shadcn, new-york). `components.json` pekar på den globala configen så `npx shadcn add …` fungerar.
- **Data:** `src/poc/use-poc-rows.ts` hämtar via `@config/resources` (samma tjänstelager som förr); faller tillbaka till exempeldata + banner om backend inte nås.

Resurser: featureFlags, labels (träd), roles, statuses, contactReasons, categories,
emailIntegration, namespaces, templates (Monaco + sök/jämför/teststatus), jsonSchemas (builder).

## Kvar att göra

- **Skrivningar** (skapa/redigera/ta bort) är ännu **dry-run** (toast) – läsning går mot riktig backend, skrivning ska kopplas mot `create/update/remove`.
- Mallarnas **riktiga** jämför/godkänn/versionering mot API (compare-service).
- i18n (appen använder hårdkodad svenska i shadcn-delen; `next-i18next` finns kvar men oanvänt).
