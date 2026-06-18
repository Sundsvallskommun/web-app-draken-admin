# shadcn/ui PoC – Draken Admin

En **proof-of-concept** som visar Draken Admin byggd med [shadcn/ui](https://ui.shadcn.com)
(Radix UI-primitiver + Tailwind) i stället för `@sk-web-gui`. Ligger på branchen
`poc/shadcn` och rör **inte** den befintliga appen.

## Köra PoC:n

```bash
yarn dev:poc      # next dev + watch som bygger om PoC-CSS:en automatiskt
```

Öppna sedan **http://localhost:3002/poc**. (Eller kör `yarn dev` + `yarn poc:css` en gång.)

Rutter:
- `/poc` – startsida med resurskort
- `/poc/statuses` – lista (TanStack Table: sortering, sök, paginering, ta bort-dialog)
- `/poc/statuses/new` och `/poc/statuses/[id]` – skapa/redigera (shadcn `Form` + react-hook-form)

> All data är mockad (`src/poc/poc-resources.ts`) – PoC:n pratar inte med backend,
> i18n eller zustand. Endast resursen **Statusar** är fullt implementerad.

## Hur isoleringen fungerar (viktigt)

shadcn och `@sk-web-gui` gör båda anspråk på samma generiska Tailwind-tokens
(`primary`, `background`, `border`, `input`, `ring`, `accent`, `muted`, `popover`…),
så de kan **inte dela samma Tailwind-config**. För att testa shadcn utan att röra
den befintliga appen är PoC:n helt isolerad:

| Fil | Roll |
|---|---|
| `tailwind.poc.config.js` | Egen Tailwind-config, **utan** sk-web-gui-preset. `important: '.shadcn-poc'` scopar alla utilities. |
| `src/styles/shadcn-poc.css` | shadcn CSS-variabler (ljus/mörk), scopeade till `.shadcn-poc` / `.shadcn-poc.dark`. Ingen global `@tailwind base`. |
| `public/shadcn-poc.out.css` | Byggs av `yarn poc:css`. Laddas bara av PoC-layouten via `<link>`. |
| `src/poc/poc-layout.tsx` | Sätter klassen `shadcn-poc` på `<html>` (så Radix-portaler under `body` också omfattas) och städar bort den när man lämnar PoC:n. |
| `src/layouts/app/app-layout.component.tsx` | `/poc`-rutter hoppar över `GuiProvider` + `LoginGuard`. |

Resten av appen (`tailwind.config.js`, alla befintliga sidor) är **orörd**.

## Komponenter

- shadcn-komponenter: `src/components/ui/*` (standard new-york-stil, hämtade från registryt)
- `components.json` pekar på PoC-configen, så `npx shadcn add <komponent>` /
  shadcn-MCP:n lägger nya komponenter i rätt isolerade kontext.
- `cn`-hjälparen: `src/utils/cn.ts`

## Slänga PoC:n

`git checkout main` – inget av detta finns på `main`.
