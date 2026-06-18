/**
 * Template selection schema — single source of truth for how a decision/investigation
 * template is identified from errand facts.
 *
 * This module is intentionally PURE (no app/service imports) so it can be duplicated
 * verbatim into web-app-draken-admin. The errand -> input derivation lives in the public
 * casedata services (see casedata-decision-service.ts), the admin form generates metadata
 * from the same rules.
 *
 * KEEP IN SYNC across repos. On any change: bump SCHEMA_VERSION and update both copies.
 * Canonical copy: web-app-draken-public.
 *
 * See docs/template-metadata-refactor.md for the full plan.
 */

export const SCHEMA_VERSION = '1.0.0';

// ── Controlled vocabularies ──────────────────────────────────────────────────
// Values use the same casing as the errand-side enums (DecisionOutcomes is UPPER_SNAKE).
// templateType keeps the established PascalCase convention used by existing metadata.

export type Process = 'MEX' | 'RPH' | 'FT' | 'RFT';
export type TemplateKind = 'DECISION' | 'INVESTIGATION';
export type Outcome = 'APPROVAL' | 'REJECTION' | 'CANCELLATION' | 'DISMISSAL';
export type Capacity = 'DRIVER' | 'PASSENGER' | 'ALL';
export type TemplateRole = 'PRIMARY' | 'SIGNATURE' | 'PHRASES' | 'SKELETON';

export const PROCESSES: Process[] = ['MEX', 'RPH', 'FT', 'RFT'];
export const TEMPLATE_KINDS: TemplateKind[] = ['DECISION', 'INVESTIGATION'];
export const OUTCOMES: Outcome[] = ['APPROVAL', 'REJECTION', 'CANCELLATION', 'DISMISSAL'];
export const CAPACITIES: Capacity[] = ['DRIVER', 'PASSENGER', 'ALL'];

/** Human labels for admin dropdowns. */
export const PROCESS_LABELS: Record<Process, string> = {
  MEX: 'Mark och exploatering',
  RPH: 'Parkeringstillstånd',
  FT: 'Färdtjänst',
  RFT: 'Riksfärdtjänst',
};

export const OUTCOME_LABELS: Record<Outcome, string> = {
  APPROVAL: 'Bifall',
  REJECTION: 'Avslag',
  CANCELLATION: 'Återkallelse',
  DISMISSAL: 'Avvisning',
};

export const CAPACITY_LABELS: Record<Capacity, string> = {
  DRIVER: 'Förare',
  PASSENGER: 'Passagerare',
  ALL: 'Alla',
};

// ── Selection facets (the routing key) ───────────────────────────────────────
// Metadata is split in two tiers: SELECTION facets (enumerated, required, unique
// together) drive routing; everything else is free-form informational metadata.

export const FACET_KEYS = {
  application: 'application',
  process: 'process',
  templateType: 'templateType',
  decision: 'decision',
  capacity: 'capacity',
  templateRole: 'templateRole',
} as const;

export type FacetKey = keyof typeof FACET_KEYS;

/**
 * Every Draken template carries this. Lower-case to match the value existing templates
 * already store (see edit form's application bootstrap). NOTE: the canonical public copy
 * may use a different casing — reconcile before metadata-based selection goes live.
 */
export const APPLICATION_VALUE = 'draken';

/** Established PascalCase metadata value per template kind. */
export const TEMPLATE_TYPE_METADATA: Record<TemplateKind, string> = {
  DECISION: 'Decision',
  INVESTIGATION: 'Investigation',
};

export interface SelectionRule {
  templateType: TemplateKind;
  process: Process;
  /** Facets (beyond application/process/templateType) that uniquely route to a template. */
  requiredFacets: FacetKey[];
}

/**
 * Which facets form the selection key per (templateType x process).
 * This is the data-driven equivalent of the old buildPdfTemplate branches.
 */
export const SELECTION_RULES: SelectionRule[] = [
  { templateType: 'DECISION', process: 'MEX', requiredFacets: [] }, // single layout template
  { templateType: 'DECISION', process: 'RPH', requiredFacets: ['decision', 'capacity'] },
  { templateType: 'DECISION', process: 'FT', requiredFacets: ['decision'] },
  { templateType: 'DECISION', process: 'RFT', requiredFacets: ['decision'] },
  // Investigation currently renders a generic document (sbk.investigation) for FT/RFT/RPH;
  // only RPH distinguishes capacity. Revisit once templates are tagged (audit step 1).
  { templateType: 'INVESTIGATION', process: 'RPH', requiredFacets: ['capacity'] },
  { templateType: 'INVESTIGATION', process: 'FT', requiredFacets: [] },
  { templateType: 'INVESTIGATION', process: 'RFT', requiredFacets: [] },
];

export const findSelectionRule = (templateType: TemplateKind, process: Process): SelectionRule | undefined =>
  SELECTION_RULES.find((r) => r.templateType === templateType && r.process === process);

// ── Identifier resolution (faithful to today's naming) ───────────────────────
// During migration the identifier remains the actual lookup key. This reproduces the
// exact strings the old buildPdfTemplate produced, but driven from the schema instead
// of inline branching. Once templates are tagged and selection moves to metadata
// (docs step 3/5), this becomes a fallback and can be removed.

export interface TemplateSelectionInput {
  process: Process;
  templateType: TemplateKind;
  /** Empty for outcomes that don't participate in identifier naming (e.g. DISMISSAL). */
  outcome: Outcome | '';
  /** Required for RPH; ignored otherwise. */
  capacity?: Capacity;
}

export function resolveTemplateIdentifier(input: TemplateSelectionInput): string {
  const { process, templateType, outcome, capacity } = input;

  if (process === 'MEX') {
    return 'mex.decision';
  }

  // RPH återkallelse använder beslutmallen även från utredningsfliken.
  const isRphCancellation = process === 'RPH' && outcome === 'CANCELLATION';

  // Investigation renders a generic document, except RPH cancellation (handled below).
  if (templateType === 'INVESTIGATION' && !isRphCancellation) {
    return 'sbk.investigation';
  }

  const out = outcome.toLowerCase();
  if (process === 'RFT') {
    return `sbk.rft.decision.${out}`;
  }
  if (process === 'FT') {
    return `sbk.ft.decision.${out}`;
  }

  // RPH
  const cap = (capacity ?? 'ALL').toLowerCase();
  const segment = outcome === 'CANCELLATION' ? 'decision' : templateType.toLowerCase();
  return `sbk.rph.${segment}.${cap}.${out}`;
}

// ── Metadata routing key (forward-looking) ───────────────────────────────────
// The KeyValue list a template SHOULD carry to be routable by metadata instead of by
// identifier. Not yet consumed by selection — pending audit/backfill (docs step 1/5).
// Admin generates the same set from its dropdowns.

export interface KeyValue {
  key: string;
  value: string;
}

export function buildSelectionMetadata(input: TemplateSelectionInput): KeyValue[] {
  const metadata: KeyValue[] = [
    { key: FACET_KEYS.application, value: APPLICATION_VALUE },
    { key: FACET_KEYS.process, value: input.process },
    { key: FACET_KEYS.templateType, value: TEMPLATE_TYPE_METADATA[input.templateType] },
  ];

  const rule = findSelectionRule(input.templateType, input.process);
  if (rule?.requiredFacets.includes('decision') && input.outcome) {
    metadata.push({ key: FACET_KEYS.decision, value: input.outcome });
  }
  if (rule?.requiredFacets.includes('capacity') && input.capacity) {
    metadata.push({ key: FACET_KEYS.capacity, value: input.capacity });
  }
  return metadata;
}
