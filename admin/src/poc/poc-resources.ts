/**
 * Config-driven registry for the shadcn PoC. Mirrors the real
 * `@config/resources` (field metadata + which actions exist), but with
 * hardcoded Swedish labels and mock rows so the PoC renders standalone
 * (no backend / i18n / zustand). The generic list/edit pages under
 * `pages/poc/[resource]/*` render entirely from this registry.
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

export type FieldType = 'text' | 'textarea' | 'code' | 'number' | 'switch' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Disabled when editing an existing record (e.g. name / namespace keys). */
  lockedOnEdit?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
  /** Show this field as a column in the list table. */
  inTable?: boolean;
}

export type PocRow = { id: string } & Record<string, unknown>;

export interface PocResource {
  name: string;
  label: string;
  description: string;
  icon: LucideIcon;
  canCreate: boolean;
  canRemove: boolean;
  /** List only, no create/edit (e.g. labels). */
  readOnly?: boolean;
  /** Extra sidebar sub-links (e.g. templates: search / compare / test-status). */
  extraNav?: { label: string; href: string }[];
  fields: FieldDef[];
  rows: PocRow[];
}

export const pocNamespaces = [
  { namespace: 'CONTACTCENTER', displayName: 'Kontaktcenter' },
  { namespace: 'BYGGLOV', displayName: 'Bygglov' },
  { namespace: 'MEX', displayName: 'Mark och exploatering' },
];

const nsOptions = pocNamespaces.map((ns) => ({ value: ns.namespace, label: `${ns.displayName} (${ns.namespace})` }));
const nsField = (): FieldDef => ({
  key: 'namespace',
  label: 'Namespace',
  type: 'select',
  required: true,
  lockedOnEdit: true,
  options: nsOptions,
  inTable: true,
});
const statusOptions = ['NEW', 'ONGOING', 'SOLVED', 'SUSPENDED'].map((s) => ({ value: s, label: s }));

// ---------------------------------------------------------------------------

const statusBase: PocRow[] = [
  { id: 'CONTACTCENTER/CONTACT', name: 'CONTACT', displayName: 'Återkoppling', externalDisplayName: 'Vi återkommer', namespace: 'CONTACTCENTER', updatedAt: '2026-05-12' },
  { id: 'CONTACTCENTER/NEW', name: 'NEW', displayName: 'Nytt ärende', externalDisplayName: 'Mottaget', namespace: 'CONTACTCENTER', updatedAt: '2026-05-30' },
  { id: 'CONTACTCENTER/ONGOING', name: 'ONGOING', displayName: 'Pågående', externalDisplayName: 'Under handläggning', namespace: 'CONTACTCENTER', updatedAt: '2026-06-01' },
  { id: 'CONTACTCENTER/SOLVED', name: 'SOLVED', displayName: 'Avslutat', externalDisplayName: 'Klart', namespace: 'CONTACTCENTER', updatedAt: '2026-06-10' },
  { id: 'BYGGLOV/PENDING', name: 'PENDING', displayName: 'Väntar på svar', externalDisplayName: 'Inväntar dig', namespace: 'BYGGLOV', updatedAt: '2026-04-22' },
  { id: 'BYGGLOV/ASSIGNED', name: 'ASSIGNED', displayName: 'Tilldelat', externalDisplayName: 'Handläggare utsedd', namespace: 'BYGGLOV', updatedAt: '2026-06-14' },
  { id: 'BYGGLOV/REJECTED', name: 'REJECTED', displayName: 'Avvisat', externalDisplayName: 'Avslaget', namespace: 'BYGGLOV', updatedAt: '2026-03-18' },
  { id: 'MEX/SUSPENDED', name: 'SUSPENDED', displayName: 'Parkerat', externalDisplayName: 'Pausat', namespace: 'MEX', updatedAt: '2026-06-16' },
];
const statusFiller: PocRow[] = Array.from({ length: 22 }, (_, i) => {
  const ns = ['CONTACTCENTER', 'BYGGLOV', 'MEX'][i % 3];
  const n = i + 1;
  return {
    id: `${ns}/STATUS_${n}`,
    name: `STATUS_${n}`,
    displayName: `Status ${n}`,
    externalDisplayName: `Extern status ${n}`,
    namespace: ns,
    updatedAt: `2026-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')}`,
  };
});

// ---------------------------------------------------------------------------

export const pocResources: PocResource[] = [
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
    rows: [
      { id: 'CONTACTCENTER/newInbox', name: 'newInbox', description: 'Ny inkorgsvy', application: 'draken', namespace: 'CONTACTCENTER', enabled: true },
      { id: 'CONTACTCENTER/aiSummary', name: 'aiSummary', description: 'AI-sammanfattning av ärenden', application: 'draken', namespace: 'CONTACTCENTER', enabled: false },
      { id: 'BYGGLOV/mapView', name: 'mapView', description: 'Kartvy för ärenden', application: 'draken', namespace: 'BYGGLOV', enabled: true },
      { id: 'BYGGLOV/bulkActions', name: 'bulkActions', description: 'Massåtgärder i listan', application: 'draken', namespace: 'BYGGLOV', enabled: false },
      { id: 'MEX/exportPdf', name: 'exportPdf', description: 'Exportera till PDF', application: 'draken', namespace: 'MEX', enabled: true },
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
    rows: [
      { id: '1', classification: 'CATEGORY', displayName: 'Vatten och avlopp', resourceName: 'vatten-avlopp', namespace: 'CONTACTCENTER' },
      { id: '2', classification: 'TYPE', displayName: 'Felanmälan', resourceName: 'felanmalan', namespace: 'CONTACTCENTER' },
      { id: '3', classification: 'CATEGORY', displayName: 'Nybyggnad', resourceName: 'nybyggnad', namespace: 'BYGGLOV' },
      { id: '4', classification: 'TYPE', displayName: 'Tillbyggnad', resourceName: 'tillbyggnad', namespace: 'BYGGLOV' },
      { id: '5', classification: 'CATEGORY', displayName: 'Markköp', resourceName: 'markkop', namespace: 'MEX' },
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
    rows: [
      { id: 'CONTACTCENTER/ADMIN', name: 'ADMIN', displayName: 'Administratör', namespace: 'CONTACTCENTER' },
      { id: 'CONTACTCENTER/AGENT', name: 'AGENT', displayName: 'Handläggare', namespace: 'CONTACTCENTER' },
      { id: 'BYGGLOV/INSPECTOR', name: 'INSPECTOR', displayName: 'Inspektör', namespace: 'BYGGLOV' },
      { id: 'BYGGLOV/VIEWER', name: 'VIEWER', displayName: 'Läsbehörig', namespace: 'BYGGLOV' },
      { id: 'MEX/MANAGER', name: 'MANAGER', displayName: 'Chef', namespace: 'MEX' },
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
    rows: [...statusBase, ...statusFiller],
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
    rows: [
      { id: 'CONTACTCENTER/INVOICE', reason: 'INVOICE', displayName: 'Faktura', namespace: 'CONTACTCENTER' },
      { id: 'CONTACTCENTER/COMPLAINT', reason: 'COMPLAINT', displayName: 'Klagomål', namespace: 'CONTACTCENTER' },
      { id: 'BYGGLOV/QUESTION', reason: 'QUESTION', displayName: 'Fråga om bygglov', namespace: 'BYGGLOV' },
      { id: 'MEX/PURCHASE', reason: 'PURCHASE', displayName: 'Markförvärv', namespace: 'MEX' },
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
    rows: [
      { id: 'CONTACTCENTER/WATER', name: 'WATER', displayName: 'Vatten', sortOrder: 1, types: 'STÖRNING, AVBROTT', namespace: 'CONTACTCENTER' },
      { id: 'CONTACTCENTER/WASTE', name: 'WASTE', displayName: 'Avfall', sortOrder: 2, types: 'HÄMTNING', namespace: 'CONTACTCENTER' },
      { id: 'BYGGLOV/BUILD', name: 'BUILD', displayName: 'Byggnation', sortOrder: 1, types: 'NYBYGGNAD, TILLBYGGNAD', namespace: 'BYGGLOV' },
      { id: 'MEX/LAND', name: 'LAND', displayName: 'Mark', sortOrder: 1, types: 'KÖP, ARRENDE', namespace: 'MEX' },
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
      { key: 'errandClosedEmailSender', label: 'Avsändare avslutat ärende', type: 'text' },
      { key: 'statusForNew', label: 'Status för nya ärenden', type: 'select', options: statusOptions, inTable: true },
      { key: 'inactiveStatus', label: 'Status vid inaktivitet', type: 'select', options: statusOptions },
      { key: 'daysOfInactivityBeforeReject', label: 'Dagar innan avvisning', type: 'number' },
      { key: 'addSenderAsStakeholder', label: 'Lägg till avsändare som intressent', type: 'switch' },
      { key: 'ignoreAutoReply', label: 'Ignorera autosvar', type: 'switch' },
      { key: 'ignoreNoReply', label: 'Ignorera no-reply', type: 'switch' },
    ],
    rows: [
      { id: 'CONTACTCENTER', namespace: 'CONTACTCENTER', enabled: true, errandNewEmailSender: 'kontakt@sundsvall.se', errandClosedEmailSender: 'noreply@sundsvall.se', statusForNew: 'NEW', inactiveStatus: 'SUSPENDED', daysOfInactivityBeforeReject: 30, addSenderAsStakeholder: true, ignoreAutoReply: true, ignoreNoReply: true },
      { id: 'BYGGLOV', namespace: 'BYGGLOV', enabled: false, errandNewEmailSender: 'bygglov@sundsvall.se', errandClosedEmailSender: '', statusForNew: 'NEW', inactiveStatus: 'SUSPENDED', daysOfInactivityBeforeReject: 14, addSenderAsStakeholder: false, ignoreAutoReply: true, ignoreNoReply: true },
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
    rows: [
      { id: 'CONTACTCENTER', namespace: 'CONTACTCENTER', displayName: 'Kontaktcenter', shortCode: 'CC', notificationTTLInDays: 40, accessControl: false, notifyReporter: true },
      { id: 'BYGGLOV', namespace: 'BYGGLOV', displayName: 'Bygglov', shortCode: 'BL', notificationTTLInDays: 90, accessControl: true, notifyReporter: false },
      { id: 'MEX', namespace: 'MEX', displayName: 'Mark och exploatering', shortCode: 'MEX', notificationTTLInDays: 60, accessControl: true, notifyReporter: true },
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
      { label: 'Sök efter mall', href: '/poc/templates/search' },
      { label: 'Jämför miljöer', href: '/poc/templates/compare' },
      { label: 'Teststatus', href: '/poc/templates/test-status' },
    ],
    fields: [
      { key: 'identifier', label: 'Identifierare', type: 'text', required: true, lockedOnEdit: true, inTable: true },
      { key: 'name', label: 'Namn', type: 'text', inTable: true },
      { key: 'version', label: 'Version', type: 'text', inTable: true },
      { key: 'description', label: 'Beskrivning', type: 'textarea' },
      { key: 'content', label: 'Innehåll', type: 'code', help: 'Markdown i Monaco-editor.' },
      { key: 'changeLog', label: 'Ändringslogg', type: 'text' },
    ],
    rows: [
      { id: 'errand.confirmation', identifier: 'errand.confirmation', name: 'Bekräftelse ärende', version: '1.3', description: 'Skickas när ett ärende skapas.', content: 'Hej {{name}},\n\nVi har tagit emot ditt ärende {{errandId}}.', changeLog: 'Lade till ärende-id' },
      { id: 'errand.closed', identifier: 'errand.closed', name: 'Avslutat ärende', version: '2.0', description: 'Skickas när ett ärende avslutas.', content: 'Hej {{name}},\n\nDitt ärende är nu avslutat.', changeLog: 'Ny ton' },
      { id: 'decision.letter', identifier: 'decision.letter', name: 'Beslutsbrev', version: '1.0', description: 'Beslutsmall för bygglov.', content: '# Beslut\n\n{{decision}}', changeLog: 'Första versionen' },
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
      { key: 'value', label: 'Schema (JSON)', type: 'code', required: true, help: 'JSON i Monaco-editor. (Schema-builder/förhandsvisning är utanför PoC-omfång.)' },
    ],
    rows: [
      { id: 'contact-form', name: 'contact-form', version: '1.2', description: 'Kontaktformulär', value: '{\n  "type": "object",\n  "properties": {\n    "email": { "type": "string" }\n  }\n}' },
      { id: 'building-permit', name: 'building-permit', version: '3.0', description: 'Bygglovsansökan', value: '{\n  "type": "object",\n  "properties": {\n    "area": { "type": "number" }\n  }\n}' },
    ],
  },
];

export function getPocResource(name: string | undefined): PocResource | undefined {
  return pocResources.find((r) => r.name === name);
}
