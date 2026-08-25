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
- **Skal/sidor:** `src/admin/` (layout, sidebar, generisk tabell/formulär, etikett-träd, schema-builder, Monaco-fält, mall-form). Rutter under `src/pages/`.
- **Komponenter:** `src/components/ui/*` (shadcn, new-york). `components.json` pekar på den globala configen så `npx shadcn add …` fungerar.
- **Data:** `src/admin/use-resource-data.ts` hämtar **riktig data** via `@config/resources`
  (samma tjänstelager som förr). Ingen mock/fallback — vid fel visas ett felstate.
  Skrivningar (`createRow/updateRow/removeRow`) går alltid mot API:et. Namespaces hämtas
  live via `src/admin/use-namespaces.ts`.
- **Register:** `src/admin/resource-config.ts` – endast fältmetadata (ingen data).

Resurser: featureFlags, labels (träd), roles, statuses, contactReasons, categories,
emailIntegration, namespaces, templates (Monaco/rich text + sök/jämför/teststatus), jsonSchemas (builder).

## Kvar att göra

- Mallarnas **riktiga** miljöjämförelse mot API (compare-service) – nu visas mallens innehåll.
- i18n (appen använder hårdkodad svenska i admin-delen; `next-i18next` finns kvar men oanvänt).
