/**
 * Resource registry: field metadata + which actions each resource supports.
 * Drives the generic list/edit pages. No data lives here — rows come from the
 * backend via `@config/resources` (see use-resource-data.ts).
 */
import {
  Boxes,
  Braces,
  CircleDot,
  FileText,
  Flag,
  FolderTree,
  Gavel,
  Mail,
  MessageSquareQuote,
  MessageSquare,
  Paperclip,
  Tags,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'code' | 'richtext' | 'number' | 'switch' | 'select' | 'categoryTypes';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Disabled when editing an existing record (e.g. name / namespace keys). */
  lockedOnEdit?: boolean;
  /** Server-owned value (e.g. timestamps): shown but never editable or submitted. */
  readOnly?: boolean;
  /** Only shown when editing an existing record (e.g. deprecated). */
  hiddenOnCreate?: boolean;
  /** Options for non-namespace selects (namespace options are fetched live). */
  options?: { value: string; label: string }[];
  help?: string;
  /**
   * The API value is a string array; the form edits it as comma-separated text
   * and the table shows it joined.
   */
  list?: boolean;
  /** Show this field as a column in the list table. */
  inTable?: boolean;
  /** Show an exact-value filter for this field above the list table. */
  filterable?: boolean;
  /**
   * Virtual form field that reads/writes one logical value across several API
   * fields, e.g. email text + HTML template bodies that must stay in sync.
   */
  syncKeys?: string[];
  /** Rich text editor output targets when plain text and markup have separate API fields. */
  richTextTargets?: { plainText: string; markup: string };
}

export type ResourceRow = { id: string; __key?: string } & Record<string, unknown>;

export interface ResourceNavItem {
  label: string;
  href: string;
  /** Hidden unless test-only admin features are enabled for the current environment. */
  testOnly?: boolean;
}

export interface ResourceConfig {
  name: string;
  label: string;
  description: string;
  icon: LucideIcon;
  canCreate: boolean;
  canRemove: boolean;
  /** List only, no create/edit (e.g. labels). */
  readOnly?: boolean;
  /**
   * The data wrapper has no "all namespaces" variant — it needs a specific
   * namespace from the UI before fetching.
   * The list shows a "välj namespace"-prompt until one is picked instead of
   * fetching nothing.
   */
  requiresNamespace?: boolean;
  /** Extra sidebar sub-links (e.g. templates: search / compare / test-status). */
  extraNav?: ResourceNavItem[];
  fields: FieldDef[];
}

const nsField = (): FieldDef => ({
  key: 'namespace',
  label: 'Namespace',
  type: 'select',
  required: true,
  lockedOnEdit: true,
  inTable: true,
});

const deprecatedField = (): FieldDef => ({
  key: 'deprecated',
  label: 'Deprecated',
  type: 'switch',
  hiddenOnCreate: true,
  help: 'Avveckla i stället för att ta bort, så behåller befintliga ärenden sitt värde.',
  inTable: true,
});

// Status values for the e-post-integration selects (a small config enum).
const statusOptions = ['NEW', 'ONGOING', 'SOLVED', 'SUSPENDED'].map((s) => ({ value: s, label: s }));

/**
 * Shared field set for the Support Management namespace-metadata resources
 * (attachment purposes, measure types, decision/statement outcomes). They all
 * carry name/displayName/sortOrder/deprecated/namespace/updatedAt; resource-
 * specific fields are spliced in at fixed positions so the form/table order
 * stays predictable.
 */
const metadataFields = (opts: {
  /** Example technical name shown in the help text for `name`. */
  nameExample?: string;
  deprecatedHelp: string;
  /** Extra fields placed between displayName and sortOrder. */
  afterDisplayName?: FieldDef[];
  /** Extra fields placed between sortOrder and deprecated. */
  afterSortOrder?: FieldDef[];
}): FieldDef[] => [
  {
    key: 'name',
    label: 'Namn',
    type: 'text',
    required: true,
    lockedOnEdit: true,
    help: `Tekniskt namn som används som nyckel${opts.nameExample ? `, t.ex. "${opts.nameExample}"` : ''}. Kan inte ändras efter skapande.`,
    inTable: true,
  },
  { key: 'displayName', label: 'Visningsnamn', type: 'text', inTable: true },
  ...(opts.afterDisplayName ?? []),
  { key: 'sortOrder', label: 'Sorteringsordning', type: 'number', inTable: true },
  ...(opts.afterSortOrder ?? []),
  { key: 'deprecated', label: 'Utfasad', type: 'switch', help: opts.deprecatedHelp, inTable: true },
  nsField(),
  { key: 'updatedAt', label: 'Uppdaterad', type: 'text', readOnly: true, inTable: true },
];

export const resourceConfigs: ResourceConfig[] = [
  {
    name: 'featureFlags',
    label: 'Feature-flaggor',
    description: 'Slå på och av funktioner per namespace.',
    icon: Flag,
    canCreate: true,
    canRemove: true,
    fields: [
      { key: 'name', label: 'Namn', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'description', label: 'Beskrivning', type: 'text', required: true, inTable: true },
      { key: 'application', label: 'Applikation', type: 'text', required: true, inTable: true },
      nsField(),
      { key: 'enabled', label: 'Aktiverad', type: 'switch', inTable: true },
    ],
  },
  {
    name: 'labels',
    label: 'Etiketter',
    description: 'Hierarki av etiketter för ärenden.',
    icon: Tags,
    canCreate: false,
    canRemove: false,
    readOnly: true,
    fields: [
      { key: 'classification', label: 'Klassificering', type: 'text', inTable: true },
      { key: 'displayName', label: 'Visningsnamn', type: 'text', inTable: true },
      { key: 'resourceName', label: 'Resursnamn', type: 'text', inTable: true },
      nsField(),
    ],
  },
  {
    name: 'roles',
    label: 'Roller',
    description: 'Behörighetsroller per namespace.',
    icon: Users,
    canCreate: true,
    canRemove: true,
    fields: [
      { key: 'name', label: 'Namn', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'displayName', label: 'Visningsnamn', type: 'text', inTable: true },
      nsField(),
      deprecatedField(),
    ],
  },
  {
    name: 'statuses',
    label: 'Statusar',
    description: 'Ärendestatusar och visningsnamn.',
    icon: CircleDot,
    canCreate: true,
    canRemove: true,
    fields: [
      {
        key: 'name',
        label: 'Namn',
        type: 'text',
        required: true,
        lockedOnEdit: true,
        help: 'Tekniskt namn. Kan inte ändras efter skapande.',
        inTable: true,
      },
      { key: 'displayName', label: 'Visningsnamn', type: 'text', inTable: true },
      {
        key: 'externalDisplayName',
        label: 'Externt visningsnamn',
        type: 'text',
        help: 'Visas för medborgaren.',
        inTable: true,
      },
      nsField(),
      deprecatedField(),
      { key: 'updatedAt', label: 'Uppdaterad', type: 'text', inTable: true },
    ],
  },
  {
    name: 'contactReasons',
    label: 'Kontaktorsaker',
    description: 'Orsaker till kontakt per namespace.',
    icon: MessageSquare,
    canCreate: true,
    canRemove: true,
    fields: [
      { key: 'reason', label: 'Orsak', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'displayName', label: 'Visningsnamn', type: 'text', inTable: true },
      nsField(),
      deprecatedField(),
    ],
  },
  {
    name: 'categories',
    label: 'Ärendekategorier',
    description: 'Ärendekategorier och typer.',
    icon: FolderTree,
    canCreate: true,
    canRemove: true,
    fields: [
      { key: 'name', label: 'Namn', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'displayName', label: 'Visningsnamn', type: 'text', inTable: true },
      { key: 'sortOrder', label: 'Sorteringsordning', type: 'number', inTable: true },
      nsField(),
      deprecatedField(),
      {
        key: 'types',
        label: 'Typer',
        type: 'categoryTypes',
        help: 'Eskaleringsadressen förifylls som mottagare när ett ärende med typen överlämnas via e-post.',
      },
    ],
  },
  {
    name: 'attachmentPurposes',
    label: 'Bilagekategorier',
    description: 'Kategorier som bilagor på ärenden kan märkas med, per namespace.',
    icon: Paperclip,
    canCreate: true,
    canRemove: true,
    fields: metadataFields({
      nameExample: 'RESPONSE',
      deprecatedHelp: 'Utfasade kategorier kan inte väljas för nya bilagor men finns kvar på befintliga.',
    }),
  },
  {
    name: 'measureTypes',
    label: 'Åtgärdstyper',
    description: 'Typer av åtgärder på ärenden, grupperade i åtgärdsgrupper, per namespace.',
    icon: Wrench,
    canCreate: true,
    canRemove: true,
    fields: metadataFields({
      deprecatedHelp: 'Utfasade åtgärdstyper kan inte väljas för nya åtgärder men finns kvar på befintliga.',
      afterDisplayName: [
        {
          key: 'measureGroups',
          label: 'Åtgärdsgrupper (kommaseparerat)',
          type: 'text',
          list: true,
          required: true,
          help: 'En åtgärdstyp tillhör minst en grupp. T.ex. "INSPECTION, FOLLOW_UP".',
          inTable: true,
        },
      ],
    }),
  },
  {
    name: 'decisionOutcomes',
    label: 'Beslutsutfall',
    description: 'Utfall som ett beslut på ett ärende kan få, per namespace.',
    icon: Gavel,
    canCreate: true,
    canRemove: true,
    fields: metadataFields({
      nameExample: 'APPROVED',
      deprecatedHelp: 'Utfasade utfall kan inte väljas för nya beslut men finns kvar på befintliga.',
    }),
  },
  {
    name: 'statementOutcomes',
    label: 'Yttrandeutfall',
    description: 'Utfall som en begäran om yttrande på ett ärende kan få, per namespace.',
    icon: MessageSquareQuote,
    canCreate: true,
    canRemove: true,
    fields: metadataFields({
      nameExample: 'NO_RESPONSE',
      deprecatedHelp: 'Utfasade utfall kan inte väljas för nya yttranden men finns kvar på befintliga.',
      afterSortOrder: [
        {
          key: 'responded',
          label: 'Motparten svarade',
          type: 'switch',
          help: 'På: utfallet innebär att motparten svarade och ett svarsdatum krävs. Av: t.ex. inget svar inom tidsfristen.',
          inTable: true,
        },
      ],
    }),
  },
  {
    name: 'emailIntegration',
    label: 'E-postintegration',
    description: 'Inställningar för inkommande e-post.',
    icon: Mail,
    canCreate: false,
    canRemove: false,
    fields: [
      nsField(),
      { key: 'enabled', label: 'Aktiverad', type: 'switch', inTable: true },
      { key: 'errandNewEmailSender', label: 'Avsändare nytt ärende', type: 'text' },
      {
        key: 'errandNewEmailBody',
        label: 'Textmall nytt ärende',
        type: 'richtext',
        richTextTargets: { plainText: 'errandNewEmailTemplate', markup: 'errandNewEmailHTMLTemplate' },
        help: 'Sparar ren text till textparametern och HTML-markup till HTML-parametern.',
      },
      { key: 'errandClosedEmailSender', label: 'Avsändare avslutat ärende', type: 'text' },
      {
        key: 'errandClosedEmailBody',
        label: 'Textmall avslutat ärende',
        type: 'richtext',
        richTextTargets: { plainText: 'errandClosedEmailTemplate', markup: 'errandClosedEmailHTMLTemplate' },
        help: 'Sparar ren text till textparametern och HTML-markup till HTML-parametern.',
      },
      { key: 'statusForNew', label: 'Status för nya ärenden', type: 'select', options: statusOptions, inTable: true },
      { key: 'triggerStatusChangeOn', label: 'Trigga statusändring vid', type: 'select', options: statusOptions },
      { key: 'statusChangeTo', label: 'Byt status till', type: 'select', options: statusOptions },
      { key: 'inactiveStatus', label: 'Status vid inaktivitet', type: 'select', options: statusOptions },
      { key: 'daysOfInactivityBeforeReject', label: 'Dagar innan avvisning', type: 'number' },
      { key: 'addSenderAsStakeholder', label: 'Lägg till avsändare som intressent', type: 'switch' },
      { key: 'stakeholderRole', label: 'Intressentroll', type: 'text' },
      { key: 'errandChannel', label: 'Ärendekanal', type: 'text' },
      { key: 'ignoreAutoReply', label: 'Ignorera autosvar', type: 'switch' },
      { key: 'ignoreNoReply', label: 'Ignorera no-reply', type: 'switch' },
    ],
  },
  {
    name: 'namespaces',
    label: 'Namespaces',
    description: 'Verksamhetsområden i Draken.',
    icon: Boxes,
    canCreate: true,
    canRemove: false,
    extraNav: [{ label: 'Importera / exportera', href: '/namespaces/import' }],
    fields: [
      { key: 'namespace', label: 'Namespace', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'displayName', label: 'Visningsnamn', type: 'text', required: true, inTable: true },
      { key: 'shortCode', label: 'Kortkod', type: 'text', required: true, inTable: true },
      { key: 'notificationTTLInDays', label: 'Notis-TTL (dagar)', type: 'number', required: true, inTable: true },
      { key: 'accessControl', label: 'Åtkomstkontroll', type: 'switch' },
      { key: 'notifyReporter', label: 'Notifiera anmälare', type: 'switch' },
    ],
  },
  {
    name: 'templates',
    label: 'Mallar',
    description: 'Dokument- och meddelandemallar.',
    icon: FileText,
    canCreate: true,
    canRemove: false,
    extraNav: [
      { label: 'Sök efter mall', href: '/templates/search' },
      { label: 'Jämför miljöer', href: '/templates/compare' },
      { label: 'Teststatus', href: '/templates/test-status', testOnly: true },
    ],
    fields: [
      { key: 'identifier', label: 'Identifierare', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'name', label: 'Namn', type: 'text', inTable: true },
      { key: 'description', label: 'Beskrivning', type: 'textarea', inTable: true },
      { key: 'templateType', label: 'Malltyp', type: 'select', inTable: true, filterable: true },
      { key: 'version', label: 'Version', type: 'text', inTable: true },
      { key: 'namespace', label: 'Namespace', type: 'select' },
      { key: 'content', label: 'Innehåll', type: 'code' },
      { key: 'changeLog', label: 'Ändringslogg', type: 'text' },
    ],
  },
  {
    name: 'jsonSchemas',
    label: 'JSON-scheman',
    description: 'Versionerade JSON-scheman.',
    icon: Braces,
    canCreate: true,
    canRemove: true,
    fields: [
      { key: 'name', label: 'Namn', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'version', label: 'Version', type: 'text', required: true, inTable: true },
      { key: 'description', label: 'Beskrivning', type: 'textarea', inTable: true },
      { key: 'value', label: 'Schema (JSON)', type: 'code', required: true },
    ],
  },
];

export function getResourceConfig(name: string | undefined): ResourceConfig | undefined {
  return resourceConfigs.find((r) => r.name === name);
}
