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
  Mail,
  MessageSquare,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'code' | 'richtext' | 'number' | 'switch' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Disabled when editing an existing record (e.g. name / namespace keys). */
  lockedOnEdit?: boolean;
  /** Options for non-namespace selects (namespace options are fetched live). */
  options?: { value: string; label: string }[];
  help?: string;
  /** Show this field as a column in the list table. */
  inTable?: boolean;
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

// Status values for the e-post-integration selects (a small config enum).
const statusOptions = ['NEW', 'ONGOING', 'SOLVED', 'SUSPENDED'].map((s) => ({ value: s, label: s }));

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
      { key: 'name', label: 'Namn', type: 'text', required: true, lockedOnEdit: true, help: 'Tekniskt namn. Kan inte ändras efter skapande.', inTable: true },
      { key: 'displayName', label: 'Visningsnamn', type: 'text', inTable: true },
      { key: 'externalDisplayName', label: 'Externt visningsnamn', type: 'text', help: 'Visas för medborgaren.', inTable: true },
      nsField(),
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
    ],
  },
  {
    name: 'categories',
    label: 'Kategorier',
    description: 'Ärendekategorier och typer.',
    icon: FolderTree,
    canCreate: true,
    canRemove: true,
    fields: [
      { key: 'name', label: 'Namn', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'displayName', label: 'Visningsnamn', type: 'text', inTable: true },
      { key: 'sortOrder', label: 'Sorteringsordning', type: 'number', inTable: true },
      { key: 'types', label: 'Typer (kommaseparerat)', type: 'text', help: 'T.ex. "STÖRNING, AVBROTT".' },
      nsField(),
    ],
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
      { key: 'version', label: 'Version', type: 'text', inTable: true },
      { key: 'description', label: 'Beskrivning', type: 'textarea' },
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
