# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Admin panel ("Draken admin") for Sundsvalls kommun. Two independent Yarn projects in one repo:

- `backend/` — Express + `routing-controllers` BFF that proxies the municipality's WSO2 API gateway and handles SAML login.
- `admin/` — Next.js 15 (**pages router**) frontend, shadcn/ui + Tailwind. UI text is hardcoded Swedish (`next-i18next` is installed but unused).

There is no workspace root — install and run commands inside each project directory. Node >= 20, Yarn.

## Commands

Backend (`cd backend`):

```bash
yarn dev                 # nodemon + ts-node, port from PORT (.env.example.local uses 3003)
yarn build               # prisma generate && tsc && tsc-alias
yarn test                # jest (ts-jest)
yarn test -- src/tests/labels.controller.test.ts   # single test file
yarn test -- -t "name"   # single test by name
yarn lint / yarn lint:fix
yarn type-check
yarn prisma:generate && yarn prisma:migrate         # sqlite db under backend/data/database
yarn generate:contracts  # regenerate src/data-contracts/* from gateway swagger
```

Admin (`cd admin`):

```bash
yarn dev                 # next dev via dotenv, PORT from .env (3002)
yarn build
yarn lint
npx jest                 # NOTE: no "test" script in package.json
npx jest src/admin/__tests__/label-editor.test.jsx   # single test file
yarn cypress             # opens Cypress
yarn generate:contracts  # regenerate src/data-contracts/backend from the backend's swagger.json
```

Env files (not committed): `backend/.env.development.local` + `.env.test.local` (copy from `.env.example.local`), `admin/.env` (copy from `.env-example`).

`.github/workflows/cypress.yml` still points at a `frontend/` directory that no longer exists — CI e2e is effectively dead; don't assume it validates changes.

## Architecture

### Request path

Browser → `admin` (session cookie, `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_API_PATH`) → `backend` controller → `ApiService` → WSO2 gateway.

- `backend/src/app.ts` wires everything: helmet/cors/session (file store, or memory when `SESSION_MEMORY=true`), passport SAML strategy, `routing-controllers` under `BASE_URL_PREFIX`, optional Swagger at `/api-docs` + `/swagger.json`.
- SAML login only succeeds if the user's AD groups contain `ADMIN_PANEL_GROUP`; that group maps to the internal `app_admin` role in `services/authorization.service.ts`, which grants `canUseAdminPanel`. Guard endpoints with `@UseBefore(authMiddleware)` and, for privileged ones, `hasPermissions(['canUseAdminPanel'])`.
- `services/api.service.ts` adds the OAuth bearer token (client-credentials, cached per base URL in `api-token.service.ts`) and `X-Sent-By` from the session user. Gateway errors are collapsed to 404/500 — a 500 here usually means the WSO2 application isn't subscribed to that API.

### API versions and the alias indirection

`backend/src/config/api-config.ts` lists every subscribed gateway API with its version. Controllers must build URLs via `apiServiceName('supportmanagement')`, never hardcode `supportmanagement/15.2`. `API_SERVICE_ALIASES` currently reroutes `supportmanagement` to a temporary sprint API (`support-management-alkt-sprint`) — remove the alias, not the call sites, when that ends. Changing a version here means re-running `yarn generate:contracts`.

### Generated data contracts

`src/data-contracts/**` is generated, not hand-written, in both projects. Backend generates from the gateway's swagger per API in `APIS`; admin generates from the backend's own `swagger.json` (requires the backend running with `SWAGGER_ENABLED=true`). Edit the source controller/DTO and regenerate rather than patching contracts.

### Resource registry (the admin's core pattern)

Most admin screens are generic and driven by two registries that must stay in sync:

- `admin/src/config/resources.ts` — the *data* binding: each resource maps `getOne/getMany/create/update/remove` onto generated `Api` methods, plus `defaultValues` and `requiredFields`. Composite-id resources (roles, statuses, contactReasons, categories) split `"namespace/name"` inside these wrappers.
- `admin/src/admin/resource-config.ts` — the *presentation* metadata: fields, types, `lockedOnEdit`, `inTable`, `filterable`, `canCreate/canRemove/readOnly/requiresNamespace`, sidebar nav.

`admin/src/admin/use-resource-data.ts` joins them and owns the id juggling: `computeRowId` (routing key) vs `apiEditId` (what each write wrapper expects). Both switch per resource — when adding a resource, check whether it needs a case there. Pages `src/pages/[resource]/index.tsx` and `[...id].tsx` render everything generically; only resources with special UI get their own page (`labels`, `templates`, `jsonSchemas`, `featureFlags`).

Adding a resource typically means: backend controller + DTO/response → regenerate contracts in both projects → entry in `resources.ts` → entry in `resource-config.ts`.

### Notable resource specifics

- **Labels** are a whole tree, not rows: read/written as one `labelStructure` per namespace (`labels.controller.ts` sorts leaves first, then by display name). Editing is `label-tree.tsx` + `label-editor.ts`, and the whole tree is PUT back.
- **Templates** carry selection metadata governed by `admin/src/config/template-schema.ts` — controlled vocabularies (`Process`, `TemplateKind`, `Outcome`, `Capacity`, `TemplateRole`) and `SELECTION_RULES` that decide which facets a template must set. That file is **deliberately duplicated** with `web-app-draken-public` (canonical copy lives there); any change must bump `SCHEMA_VERSION` and be mirrored. Background: `docs/template-metadata-refactor.md`.
- **Feature flags** are the only locally-persisted data — Prisma/sqlite (`backend/prisma/schema.prisma`), everything else is proxied.
- **Compare** (`compare.controller.ts`) diffs the current environment against a second gateway configured via `API_COMPARE_URL` / `CLIENT_KEY_COMPARE` / `CLIENT_SECRET_COMPARE`; it silently no-ops when those are unset. That controller's header comment documents how to add a new comparison (its step 3 references a `components/menu/menu.tsx` that no longer exists — add nav in `resource-config.ts` `extraNav` instead).

### Environment banner

`adminEnvironmentFromApiBaseUrl` (backend) classifies the target as `test` when the `API_BASE_URL` hostname contains `-test`, otherwise `production`; the frontend turns that into the red/blue header treatment in `admin/src/utils/admin-environment.ts`. `shouldTreatAsProduction` defaults to production on unknown — keep that fail-safe direction when touching it. Test-only features (e.g. template test status, `NEXT_PUBLIC_ENABLE_TEMPLATE_TEST_STATUS`, `testOnly` nav items) hang off this.

### Municipality

`municipalityId` lives in localStorage (`use-localstorage.hook.ts`, default `2281` = Sundsvall) and is threaded as the first argument through every resource service call.

## Conventions

- Path aliases are configured per project (`@config`, `@services`, `@interfaces`, `@utils`, `@admin`, `@components`, `@data-contracts`, …) in each `tsconfig.json` and mirrored in each `jest.config.js`. Admin uses `@config/*` → `src/config/*`; backend uses bare `@config` → `src/config`.
- Admin ESLint sets `@typescript-eslint/no-explicit-any` to **error**; `strict` TS is on. Prefer typed contract types over `any` when wiring generated APIs.
- shadcn components go to `src/components/ui` via `npx shadcn add …` (`components.json`, new-york style); see `admin/SHADCN.md`.
- Admin tests are `.test.jsx` under `__tests__` (Cypress uses `.spec`/`.cy` and is excluded by the jest `testRegex`). Backend tests are `src/tests/*.test.ts`.
- Backend has husky + lint-staged; commits run prettier/eslint on staged files.
