import {
  LABEL_RESOURCE_NAME_PATTERN,
  LabelImportDto,
  NAMESPACE_IMPORT_FORMAT_VERSION,
  NAMESPACE_NAME_PATTERN,
  NamespaceImportDto,
} from '@/dtos/namespace-import.dto';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';

/**
 * Pure validation and planning for a namespace import document. No I/O here; the service
 * supplies the ExistingState when the target namespace already exists.
 */

export const SECTION_ORDER = [
  'namespaceConfig',
  'statuses',
  'roles',
  'categories',
  'contactReasons',
  'attachmentPurposes',
  'measureTypes',
  'decisionOutcomes',
  'statementOutcomes',
  'labels',
  'emailIntegration',
  'featureFlags',
] as const;

export type ImportSection = (typeof SECTION_ORDER)[number];

export type IssueSeverity = 'error' | 'warning';

export interface ImportIssue {
  /** JSON path into the document, e.g. `categories[1].types[0].name`. */
  path: string;
  message: string;
  severity: IssueSeverity;
}

export interface ImportPlanEntry {
  section: ImportSection;
  create: number;
  skip: number;
  /** Keys of items that already exist and will be left untouched. */
  skipped: string[];
}

/** What already exists in the target namespace. Only populated under `allowExisting`. */
export interface ExistingState {
  statuses: Set<string>;
  roles: Set<string>;
  categories: Set<string>;
  contactReasons: Set<string>;
  attachmentPurposes: Set<string>;
  measureTypes: Set<string>;
  decisionOutcomes: Set<string>;
  statementOutcomes: Set<string>;
  hasLabels: boolean;
  hasEmailIntegration: boolean;
  /** `${application}::${name}` */
  featureFlags: Set<string>;
}

export const featureFlagKey = (flag: { application: string; name: string }): string => `${flag.application}::${flag.name}`;

const UPPERCASE_NAMESPACE = /^[A-Z0-9_]+$/;
const LENIENT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBlank = (value: unknown): boolean => typeof value !== 'string' || value.trim() === '';

const error = (path: string, message: string): ImportIssue => ({ path, message, severity: 'error' });
const warning = (path: string, message: string): ImportIssue => ({ path, message, severity: 'warning' });

export const hasErrors = (issues: ImportIssue[]): boolean => issues.some(issue => issue.severity === 'error');

// ---------------------------------------------------------------------------
// Structural validation (class-validator)
// ---------------------------------------------------------------------------

const joinPath = (parent: string, property: string): string => {
  if (/^\d+$/.test(property)) return `${parent}[${property}]`;
  return parent ? `${parent}.${property}` : property;
};

export function flattenValidationErrors(errors: ValidationError[], parent = ''): ImportIssue[] {
  return errors.flatMap(err => {
    const path = joinPath(parent, err.property);
    const own = Object.values(err.constraints ?? {}).map(message => error(path, message));
    const nested = err.children?.length ? flattenValidationErrors(err.children, path) : [];
    return [...own, ...nested];
  });
}

/**
 * Runs the class-validator decorators on the document with whitelist + forbidNonWhitelisted,
 * so unknown properties (typos, fields from a newer format) are reported instead of being
 * silently dropped or forwarded to the gateway.
 */
export function validateStructure(body: unknown): ImportIssue[] {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return [error('', 'Dokumentet måste vara ett JSON-objekt.')];
  }
  const instance = body instanceof NamespaceImportDto ? body : plainToInstance(NamespaceImportDto, body);
  return flattenValidationErrors(validateSync(instance, { whitelist: true, forbidNonWhitelisted: true }));
}

// ---------------------------------------------------------------------------
// Semantic validation
// ---------------------------------------------------------------------------

type KeyedSection = Exclude<ImportSection, 'namespaceConfig' | 'labels' | 'emailIntegration' | 'featureFlags'>;

const SECTION_KEY_FIELD: Record<KeyedSection, 'name' | 'reason'> = {
  statuses: 'name',
  roles: 'name',
  categories: 'name',
  contactReasons: 'reason',
  attachmentPurposes: 'name',
  measureTypes: 'name',
  decisionOutcomes: 'name',
  statementOutcomes: 'name',
};

const KEYED_SECTIONS = Object.keys(SECTION_KEY_FIELD) as KeyedSection[];

/** The shape shared by every keyed item: one of `name` / `reason` identifies it. */
type KeyedItem = { name?: string; reason?: string };

function itemKey(section: KeyedSection, item: KeyedItem): string | undefined {
  const value = item[SECTION_KEY_FIELD[section]];
  return typeof value === 'string' ? value.trim() : undefined;
}

function checkUniqueKeys(section: KeyedSection, items: KeyedItem[] | undefined, issues: ImportIssue[]): Set<string> {
  const seen = new Set<string>();
  const field = SECTION_KEY_FIELD[section];
  (items ?? []).forEach((item, index) => {
    const path = `${section}[${index}].${field}`;
    const key = itemKey(section, item);
    if (!key) {
      issues.push(error(path, `${field} får inte vara tomt.`));
      return;
    }
    if (seen.has(key)) {
      issues.push(error(path, `Dubblett: "${key}" förekommer mer än en gång i ${section}.`));
      return;
    }
    seen.add(key);
  });
  return seen;
}

function checkLabels(labels: LabelImportDto[] | undefined, parentPath: string, issues: ImportIssue[]): void {
  const siblings = new Set<string>();
  (labels ?? []).forEach((label, index) => {
    const path = `${parentPath}[${index}]`;
    if (isBlank(label.classification)) {
      issues.push(error(`${path}.classification`, 'classification får inte vara tom.'));
    }
    if (isBlank(label.resourceName)) {
      issues.push(error(`${path}.resourceName`, 'resourceName får inte vara tomt.'));
    } else if (!LABEL_RESOURCE_NAME_PATTERN.test(label.resourceName)) {
      issues.push(error(`${path}.resourceName`, `resourceName "${label.resourceName}" måste bestå av A-Z, 0-9 och _.`));
    } else if (siblings.has(label.resourceName)) {
      issues.push(error(`${path}.resourceName`, `Dubblett: "${label.resourceName}" finns redan på samma nivå.`));
    } else {
      siblings.add(label.resourceName);
    }

    const keys = new Set<string>();
    (label.attributes ?? []).forEach((attribute, attrIndex) => {
      const attrPath = `${path}.attributes[${attrIndex}].key`;
      if (isBlank(attribute.key)) {
        issues.push(error(attrPath, 'Attributnyckel får inte vara tom.'));
      } else if (keys.has(attribute.key)) {
        issues.push(error(attrPath, `Dubblett: attributet "${attribute.key}" förekommer mer än en gång.`));
      } else {
        keys.add(attribute.key);
      }
    });

    checkLabels(label.labels, `${path}.labels`, issues);
  });
}

/**
 * Cross-field and cross-section rules that decorators cannot express. Assumes the document
 * already passed validateStructure. `existing` (when the target namespace exists and
 * allowExisting is set) widens the set of statuses/roles the email integration may refer to.
 */
export function validateNamespaceImport(doc: NamespaceImportDto, existing?: ExistingState | null): ImportIssue[] {
  const issues: ImportIssue[] = [];

  if (doc.formatVersion !== NAMESPACE_IMPORT_FORMAT_VERSION) {
    issues.push(error('formatVersion', `Okänd formatVersion. Stödd version: ${NAMESPACE_IMPORT_FORMAT_VERSION}.`));
  }

  if (isBlank(doc.namespace) || !NAMESPACE_NAME_PATTERN.test(doc.namespace)) {
    issues.push(error('namespace', 'namespace måste vara 1-64 tecken av A-Z, a-z, 0-9, _ och -.'));
  } else if (!UPPERCASE_NAMESPACE.test(doc.namespace)) {
    issues.push(warning('namespace', 'Befintliga namespaces använder versaler, siffror och _ (t.ex. CONTACTCENTER).'));
  }

  if (isBlank(doc.config?.displayName)) issues.push(error('config.displayName', 'displayName får inte vara tomt.'));
  if (isBlank(doc.config?.shortCode)) issues.push(error('config.shortCode', 'shortCode får inte vara tomt.'));
  const ttl = doc.config?.notificationTTLInDays;
  if (ttl !== undefined && (!Number.isInteger(ttl) || ttl < 0)) {
    issues.push(error('config.notificationTTLInDays', 'notificationTTLInDays måste vara ett heltal >= 0.'));
  }

  const keys = {} as Record<KeyedSection, Set<string>>;
  for (const section of KEYED_SECTIONS) {
    const items: KeyedItem[] | undefined = doc[section];
    if (items && items.length === 0) {
      issues.push(warning(section, `${section} är en tom lista.`));
    }
    keys[section] = checkUniqueKeys(section, items, issues);
  }

  (doc.categories ?? []).forEach((category, index) => {
    const typeNames = new Set<string>();
    (category.types ?? []).forEach((type, typeIndex) => {
      const path = `categories[${index}].types[${typeIndex}]`;
      if (isBlank(type.name)) {
        issues.push(error(`${path}.name`, 'Typnamn får inte vara tomt.'));
      } else if (typeNames.has(type.name.trim())) {
        issues.push(error(`${path}.name`, `Dubblett: typen "${type.name}" förekommer mer än en gång i kategorin.`));
      } else {
        typeNames.add(type.name.trim());
      }
      if (type.escalationEmail && !LENIENT_EMAIL.test(type.escalationEmail)) {
        issues.push(warning(`${path}.escalationEmail`, `"${type.escalationEmail}" ser inte ut som en e-postadress.`));
      }
    });
  });

  (doc.measureTypes ?? []).forEach((measureType, index) => {
    const path = `measureTypes[${index}].measureGroups`;
    const groups = measureType.measureGroups ?? [];
    if (groups.length === 0) {
      issues.push(error(path, 'En åtgärdstyp måste tillhöra minst en grupp.'));
      return;
    }
    const seen = new Set<string>();
    groups.forEach((group, groupIndex) => {
      if (isBlank(group)) {
        issues.push(error(`${path}[${groupIndex}]`, 'Gruppnamn får inte vara tomt.'));
      } else if (seen.has(group)) {
        issues.push(error(`${path}[${groupIndex}]`, `Dubblett: gruppen "${group}" förekommer mer än en gång.`));
      } else {
        seen.add(group);
      }
    });
  });

  if (doc.labels && doc.labels.length === 0) issues.push(warning('labels', 'labels är en tom lista.'));
  checkLabels(doc.labels, 'labels', issues);

  const email = doc.emailIntegration;
  if (email) {
    const knownStatuses = new Set<string>([...keys.statuses, ...(existing?.statuses ?? [])]);
    const knownRoles = new Set<string>([...keys.roles, ...(existing?.roles ?? [])]);
    const requireStatus = (field: keyof typeof email, required: boolean) => {
      const value = email[field];
      if (value === undefined || value === null || value === '') {
        if (required) issues.push(error(`emailIntegration.${field}`, `${field} måste anges.`));
        return;
      }
      if (typeof value === 'string' && !knownStatuses.has(value)) {
        issues.push(error(`emailIntegration.${field}`, `Statusen "${value}" finns varken i dokumentets statuses eller i namespacet.`));
      }
    };
    requireStatus('statusForNew', true);
    requireStatus('triggerStatusChangeOn', false);
    requireStatus('statusChangeTo', false);
    requireStatus('inactiveStatus', false);
    if (email.triggerStatusChangeOn && !email.statusChangeTo) {
      issues.push(error('emailIntegration.statusChangeTo', 'statusChangeTo måste anges när triggerStatusChangeOn är satt.'));
    }
    if (email.stakeholderRole && !knownRoles.has(email.stakeholderRole)) {
      issues.push(
        error('emailIntegration.stakeholderRole', `Rollen "${email.stakeholderRole}" finns varken i dokumentets roles eller i namespacet.`),
      );
    }
    const days = email.daysOfInactivityBeforeReject;
    if (days !== undefined && days !== null && (!Number.isInteger(days) || days < 0)) {
      issues.push(error('emailIntegration.daysOfInactivityBeforeReject', 'daysOfInactivityBeforeReject måste vara ett heltal >= 0.'));
    }
    const hasDays = days !== undefined && days !== null;
    if (email.inactiveStatus && !hasDays) {
      issues.push(warning('emailIntegration.daysOfInactivityBeforeReject', 'inactiveStatus är satt men inte daysOfInactivityBeforeReject.'));
    }
    if (hasDays && !email.inactiveStatus) {
      issues.push(warning('emailIntegration.inactiveStatus', 'daysOfInactivityBeforeReject är satt men inte inactiveStatus.'));
    }
  }

  if (doc.featureFlags && doc.featureFlags.length === 0) issues.push(warning('featureFlags', 'featureFlags är en tom lista.'));
  const flagKeys = new Set<string>();
  (doc.featureFlags ?? []).forEach((flag, index) => {
    const path = `featureFlags[${index}]`;
    if (isBlank(flag.name)) issues.push(error(`${path}.name`, 'name får inte vara tomt.'));
    if (isBlank(flag.application)) issues.push(error(`${path}.application`, 'application får inte vara tomt.'));
    if (isBlank(flag.name) || isBlank(flag.application)) return;
    const key = featureFlagKey(flag);
    if (flagKeys.has(key)) {
      issues.push(error(`${path}.name`, `Dubblett: flaggan "${flag.name}" för "${flag.application}" förekommer mer än en gång.`));
    } else {
      flagKeys.add(key);
    }
  });

  return issues;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

function planKeyed(section: KeyedSection, doc: NamespaceImportDto, existingKeys: Set<string> | undefined): ImportPlanEntry {
  const items: KeyedItem[] = doc[section] ?? [];
  const skipped = items.map(item => itemKey(section, item) ?? '').filter(key => existingKeys?.has(key));
  return { section, create: items.length - skipped.length, skip: skipped.length, skipped };
}

/**
 * What the import would create and what it would leave alone. With no ExistingState (the
 * namespace does not exist yet) everything present in the document is created.
 */
export function buildImportPlan(doc: NamespaceImportDto, existing?: ExistingState | null): ImportPlanEntry[] {
  return SECTION_ORDER.map((section): ImportPlanEntry => {
    switch (section) {
      case 'namespaceConfig':
        return existing ? { section, create: 0, skip: 1, skipped: [doc.namespace] } : { section, create: 1, skip: 0, skipped: [] };
      case 'labels': {
        const has = (doc.labels?.length ?? 0) > 0;
        if (!has) return { section, create: 0, skip: 0, skipped: [] };
        return existing?.hasLabels ? { section, create: 0, skip: 1, skipped: ['labels'] } : { section, create: 1, skip: 0, skipped: [] };
      }
      case 'emailIntegration': {
        if (!doc.emailIntegration) return { section, create: 0, skip: 0, skipped: [] };
        return existing?.hasEmailIntegration
          ? { section, create: 0, skip: 1, skipped: ['emailIntegration'] }
          : { section, create: 1, skip: 0, skipped: [] };
      }
      case 'featureFlags': {
        const flags = doc.featureFlags ?? [];
        const skipped = flags.map(featureFlagKey).filter(key => existing?.featureFlags.has(key));
        return { section, create: flags.length - skipped.length, skip: skipped.length, skipped };
      }
      default:
        return planKeyed(section, doc, existing?.[section]);
    }
  });
}
