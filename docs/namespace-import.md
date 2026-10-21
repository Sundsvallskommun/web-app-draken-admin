# Namespace export/import

A whole supportmanagement namespace can be exported to, and created from, one JSON document:
the namespace config, every namespace-scoped metadata kind, the label tree, the email
integration and the admin's own feature flags. The intended flow is that a configuration tool
produces the document and the admin imports it, or that an existing namespace is exported from
one environment and imported into another.

UI: **Namespaces → Importera / exportera** (`/namespaces/import`).

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/namespaces/:municipalityId/:namespace/export` | Returns the document for an existing namespace |
| `POST` | `/namespaces/:municipalityId/import?dryRun=true` | Validates the document and returns the plan, writes nothing |
| `POST` | `/namespaces/:municipalityId/import` | Validates and then creates everything in order |
| `POST` | `/namespaces/:municipalityId/import?allowExisting=true` | Accepts an existing namespace, creates only what is missing |

Both require the `canUseAdminPanel` permission. The import **always answers HTTP 200** with a
`NamespaceImportReport`; only auth failures and unparsable JSON are non-200.

The document schema is the `NamespaceImportDto` class in `backend/src/dtos/namespace-import.dto.ts`.
With the backend started with `SWAGGER_ENABLED=true` it is published as a JSON schema under
`components.schemas.NamespaceImportDto` in `/swagger.json`, which a configuration tool can validate against.

## Document format (`formatVersion: "1"`)

```json
{
  "formatVersion": "1",
  "exportedAt": "2026-10-16T08:00:00.000Z",
  "namespace": "MY_NAMESPACE",
  "config": {
    "displayName": "Mitt namespace",
    "shortCode": "MN",
    "notificationTTLInDays": 40,
    "accessControl": false,
    "notifyReporter": false
  },
  "statuses": [{ "name": "NEW", "displayName": "Ny" }, { "name": "SOLVED", "displayName": "Löst" }],
  "roles": [{ "name": "CONTACT", "displayName": "Kontaktperson" }],
  "categories": [
    {
      "name": "HOUSING",
      "displayName": "Boende",
      "types": [{ "name": "RENT", "displayName": "Hyra", "escalationEmail": "rent@example.com" }]
    }
  ],
  "contactReasons": [{ "reason": "QUESTION", "displayName": "Fråga" }],
  "attachmentPurposes": [{ "name": "EVIDENCE", "displayName": "Underlag" }],
  "measureTypes": [{ "name": "SITE_VISIT", "displayName": "Platsbesök", "measureGroups": ["INSPECTION"] }],
  "decisionOutcomes": [{ "name": "APPROVED", "displayName": "Beviljad" }],
  "statementOutcomes": [{ "name": "ANSWERED", "displayName": "Besvarad", "responded": true }],
  "labels": [
    {
      "classification": "CATEGORY",
      "resourceName": "HOUSING",
      "displayName": "Boende",
      "labels": [
        {
          "classification": "TYPE",
          "resourceName": "RENT",
          "displayName": "Hyra",
          "attributes": [{ "key": "escalationEmail", "value": "rent@example.com" }]
        }
      ]
    }
  ],
  "emailIntegration": {
    "enabled": true,
    "statusForNew": "NEW",
    "errandNewEmailSender": "noreply@example.com",
    "errandNewEmailTemplate": "Vi har tagit emot ditt ärende.",
    "errandNewEmailHTMLTemplate": "<p>Vi har tagit emot ditt ärende.</p>",
    "stakeholderRole": "CONTACT",
    "addSenderAsStakeholder": true,
    "ignoreAutoReply": true,
    "ignoreNoReply": true
  },
  "featureFlags": [{ "name": "newErrandView", "description": "Ny ärendevy", "enabled": true, "application": "draken" }]
}
```

Notes on the shape:

- Every section except `namespace` and `config` is optional. An export emits empty arrays for empty sections.
- Items carry **no** `namespace`, `id`, `created`/`modified` or `resourcePath`; those are derived.
- `contactReasons` are keyed by `reason`, everything else by `name`.
- `measureTypes[].measureGroups` must have at least one entry (gateway rule).
- `labels` is the gateway's `labelStructure` tree. `resourceName` must match `^[A-Z0-9_]+$`.
- `emailIntegration` uses plain `number`/`boolean` for `daysOfInactivityBeforeReject` and
  `addSenderAsStakeholder`; the backend converts to the gateway's string representation.
- `featureFlags` are stored in the admin's own database (Prisma), never sent to the gateway.
- Unknown properties anywhere are rejected (`forbidNonWhitelisted`), so typos surface instead of being dropped.

## Validation

1. **Structural** – class-validator on `NamespaceImportDto` (types, required fields, patterns, no unknown properties).
2. **Semantic** – `validateNamespaceImport` in `backend/src/utils/namespace-import-validation.ts`:
   unique keys per section, unique type names within a category, non-empty unique measure groups,
   label tree rules, and that the email integration's `statusForNew` / `triggerStatusChangeOn` /
   `statusChangeTo` / `inactiveStatus` exist among the document's statuses (or the target namespace's,
   under `allowExisting`), and that `stakeholderRole` exists among the roles. Some checks are warnings
   (lower-case namespace, odd escalation email, empty sections) and do not block the import.
3. **Environment** – the namespace must not exist unless `allowExisting=true`.

Issues are reported as `{ path, message, severity }` where `path` is a JSON path such as
`categories[1].types[0].name`.

## Report

```ts
{
  outcome: 'valid' | 'invalid' | 'conflict' | 'completed' | 'partial_failure',
  dryRun, allowExisting, namespace,
  issues: [{ path, message, severity }],
  plan:   [{ section, create, skip, skipped: string[] }],   // what would be / was intended
  steps:  [{ section, status: 'done'|'skipped'|'failed'|'not_run', created, skipped, error? }] // empty on dry run
}
```

## Execution order and resuming

Sections are created sequentially in this order:

`namespaceConfig → statuses → roles → categories → contactReasons → attachmentPurposes → measureTypes → decisionOutcomes → statementOutcomes → labels → emailIntegration → featureFlags`

The import stops at the first failing gateway call. Nothing is rolled back: the import never
deletes anything. To resume, fix the cause and run the same document again with
`allowExisting=true`: items that already exist (matched **by name only**, never diffed or
updated) are skipped and the rest are created.

### Deleting a namespace

`DELETE /namespaces/:municipalityId/:namespace?dryRun=true` inspects, `DELETE` without `dryRun`
deletes. UI: the "Ta bort" button on the namespace edit page (next to "Spara ändringar" /
"Avbryt"). Opening it runs the inspection first; confirming requires typing the namespace name. The report has `outcome` `ready` / `not_found` / `has_errands` /
`completed` / `partial_failure`, the `errandCount`, a `plan` (every item per section) and, after
execution, `steps`.

The gateway does **not** cascade: deleting only `namespace-config` leaves stray metadata and
config behind (confirmed with the supportmanagement team), so the delete removes everything
explicitly, most dependent first:

1. `DELETE .../email-integration-config`
2. `DELETE .../namespace-config/action-config/{id}` per action config
3. `DELETE .../metadata/phases/{phaseId}/transitions/{transitionId}` per transition, then `.../phases/{phaseId}` per phase
4. `DELETE .../metadata/labels` (whole tree)
5. `.../metadata/label-classifications/{classification}` and `.../metadata/external-id-types/{id}` per item
6. each item of `statementoutcomes`, `decisionoutcomes`, `measuretypes`, `attachmentpurposes`, `contactreasons`, `categories`, `roles`, `statuses` via `DELETE .../metadata/<kind>/{id}`
7. `DELETE .../namespace-config`
8. the admin's own feature flags for the namespace (Prisma `deleteMany`)

Safety rules:

- The delete is **off unless the backend runs with `NAMESPACE_DELETE_ENABLED=true`** (see
  `.env.example.local`). Without it the endpoint answers `disabled` and the admin hides the "Ta bort"
  button; the setting is exposed to the admin through `GET /admin/environment` as `namespaceDeleteEnabled`.
  Keep it `false` in production unless a namespace is actually being decommissioned.
- The delete is **refused while the namespace has errands** (`GET .../errands/count` above zero), regardless of `dryRun`. Errands must be handled first; there is no force flag.
- Like the import it stops at the first failure and never retries. What was already deleted stays deleted; run the inspection again to see what remains, then delete again.
- Phases, action configs, label classifications and external id types are deleted even though the admin does not otherwise manage them, so that nothing is left behind.

Two sections are all-or-nothing:

- **labels** – the gateway replaces the whole tree on PUT, so the import never PUTs. If the target
  namespace already has any labels, the section is skipped and must be merged by hand on the labels page.
- **emailIntegration** – skipped if the namespace already has one.

## Gateway calls (supportmanagement 17.2)

| Section | Call |
| --- | --- |
| namespaceConfig | `POST /{muni}/{ns}/namespace-config` |
| statuses … statementOutcomes | `POST /{muni}/{ns}/metadata/<kind>` per item |
| labels | `POST /{muni}/{ns}/metadata/labels` with the bare array (never `PUT`, which replaces the tree) |
| emailIntegration | `POST /{muni}/{ns}/email-integration-config` (`PUT` is update-only in the gateway) |
| featureFlags | Prisma `featureFlags.create` in one transaction |

Existing state and export use the corresponding `GET`s; a gateway 404 is treated as "nothing there".

## Known limitations

- Existing items are not compared or updated; only missing ones are created.
- `config` carries only the five fields the admin manages (`displayName`, `shortCode`, `notificationTTLInDays`, `accessControl`, `notifyReporter`). The gateway's `NamespaceConfig` has more (`roleBasedMapping`, `resourceAccessControl`, `singleDecisionPerErrand`, `processConsumer`, `processTriggers`, `excludeEventDescriptionsInEmail`, `baseUrl`, `limitedReadAccess`, `reporterAccess`, `roleFieldRestrictions`), which an export does not include.
- Gateway rejections surface as the gateway's message text in `steps[].error`, not as structured codes.
- `externalIdTypes` and `phases` exist in the gateway's metadata but are not managed by the admin, so they are not part of the document.
