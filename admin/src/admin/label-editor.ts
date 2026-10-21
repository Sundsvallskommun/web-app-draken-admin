import type { LabelAttribute, LabelNode } from '@interfaces/label';
import { setEscalationEmail } from '@utils/label-attributes';

export const ROOT_PARENT_VALUE = '__root__';

export interface LabelParentOption {
  value: string;
  label: string;
  classification?: string;
}

export interface LabelPathEntry {
  node: LabelNode;
  pathValue: string;
}

const pathFromValue = (value: string): number[] =>
  value
    .split('.')
    .map((part) => Number(part))
    .filter((part) => Number.isInteger(part));

/**
 * Conventional classification levels, outermost first. ROOT is an optional extra tier above
 * CATEGORY — namespaces that don't use it simply start at CATEGORY, and those that do can
 * hold several ROOT labels side by side (TAGROOT, CATEGORYROOT, …).
 * Classification stays free text in the API, so this only drives suggestions and defaults.
 */
export const CLASSIFICATION_LEVELS = ['ROOT', 'CATEGORY', 'TYPE', 'SUBTYPE'] as const;

const normalizedClassification = (classification: string): string => classification.trim().toUpperCase();

/** The level below `classification`, or '' for the deepest/unknown levels. */
const classificationBelow = (classification: string): string => {
  const index = CLASSIFICATION_LEVELS.indexOf(
    normalizedClassification(classification) as (typeof CLASSIFICATION_LEVELS)[number]
  );
  if (index < 0) return '';
  return CLASSIFICATION_LEVELS[index + 1] ?? '';
};

/**
 * At root level the existing top labels decide the convention: a namespace whose roots are
 * CATEGORY keeps suggesting CATEGORY, one built on ROOT suggests that. Mixed or
 * empty namespaces suggest nothing rather than guess.
 */
const rootClassification = (labels: LabelNode[]): string => {
  const distinct = new Set(labels.map((label) => normalizedClassification(label.classification ?? '')).filter(Boolean));
  return distinct.size === 1 ? [...distinct][0] : '';
};

export function defaultClassificationForParent(parent: LabelParentOption, labels: LabelNode[] = []): string {
  if (parent.value === ROOT_PARENT_VALUE) return rootClassification(labels);
  return classificationBelow(parent.classification ?? '');
}

export function resourceNameFromDisplayName(displayName: string): string {
  return displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function flattenLabelParents(labels: LabelNode[]): LabelParentOption[] {
  const options: LabelParentOption[] = [{ value: ROOT_PARENT_VALUE, label: 'Rotnivå' }];

  const visit = (items: LabelNode[], path: number[], names: string[], blockedByDeprecated: boolean) => {
    items.forEach((item, index) => {
      const nextPath = [...path, index];
      const name = item.displayName || item.resourceName || item.classification;
      const nextNames = [...names, name];
      const nextBlockedByDeprecated = blockedByDeprecated || item.deprecated === true;
      if (nextBlockedByDeprecated) return;

      options.push({
        value: nextPath.join('.'),
        label: nextNames.join(' / '),
        classification: item.classification,
      });
      visit(item.labels ?? [], nextPath, nextNames, nextBlockedByDeprecated);
    });
  };

  visit(labels, [], [], false);
  return options;
}

export function canCreateLabelBelow(labels: LabelNode[], parentValue: string): boolean {
  if (parentValue === ROOT_PARENT_VALUE) return true;

  const parentPath = pathFromValue(parentValue);
  if (parentPath.length === 0) return false;

  let items = labels;
  for (const index of parentPath) {
    const item = items[index];
    if (!item || item.deprecated === true) return false;
    items = item.labels ?? [];
  }

  return true;
}

const labelMatches = (candidate: LabelNode, current: LabelNode): boolean => {
  if (candidate.id && current.id) return candidate.id === current.id;
  return (
    candidate.resourceName === current.resourceName &&
    candidate.classification === current.classification &&
    candidate.displayName === current.displayName
  );
};

const entryForIndex = (items: LabelNode[], index: number, parentPath: string): LabelPathEntry => ({
  node: items[index],
  pathValue: parentPath ? `${parentPath}.${index}` : String(index),
});

export function rehydrateLabelPath(labels: LabelNode[], currentPath: LabelPathEntry[]): LabelPathEntry[] {
  if (currentPath.length === 0) return currentPath;

  const nextPath: LabelPathEntry[] = [];
  let items = labels;
  let parentPath = '';

  for (const currentEntry of currentPath) {
    const idIndex = currentEntry.node.id ? items.findIndex((item) => item.id === currentEntry.node.id) : -1;
    const matchIndex = idIndex >= 0 ? idIndex : items.findIndex((item) => labelMatches(item, currentEntry.node));

    if (matchIndex < 0) break;

    const nextEntry = entryForIndex(items, matchIndex, parentPath);
    nextPath.push(nextEntry);
    items = nextEntry.node.labels ?? [];
    parentPath = nextEntry.pathValue;
  }

  return nextPath;
}

export function appendLabel(labels: LabelNode[], parentValue: string, label: LabelNode): LabelNode[] {
  if (parentValue === ROOT_PARENT_VALUE) return [...labels, label];
  if (!canCreateLabelBelow(labels, parentValue)) return labels;

  const parentPath = pathFromValue(parentValue);

  const appendAtPath = (items: LabelNode[], depth: number): LabelNode[] =>
    items.map((item, index) => {
      if (index !== parentPath[depth]) return item;
      if (depth === parentPath.length - 1) {
        return { ...item, labels: [...(item.labels ?? []), label] };
      }
      return { ...item, labels: appendAtPath(item.labels ?? [], depth + 1) };
    });

  return appendAtPath(labels, 0);
}

const applyDeprecatedToSubtree = (label: LabelNode, deprecated: boolean): LabelNode => ({
  ...label,
  deprecated,
  labels: (label.labels ?? []).map((child) => applyDeprecatedToSubtree(child, deprecated)),
});

const updateLabelAtPath = (
  labels: LabelNode[],
  labelValue: string,
  updateLabel: (label: LabelNode) => LabelNode
): LabelNode[] => {
  const labelPath = pathFromValue(labelValue);
  if (labelPath.length === 0) return labels;

  const updateAtPath = (items: LabelNode[], depth: number): LabelNode[] =>
    items.map((item, index) => {
      if (index !== labelPath[depth]) return item;
      if (depth === labelPath.length - 1) return updateLabel(item);
      return { ...item, labels: updateAtPath(item.labels ?? [], depth + 1) };
    });

  return updateAtPath(labels, 0);
};

export function setLabelDeprecated(labels: LabelNode[], labelValue: string, deprecated: boolean): LabelNode[] {
  return updateLabelAtPath(labels, labelValue, (label) => applyDeprecatedToSubtree(label, deprecated));
}

export function setLabelDisplayName(labels: LabelNode[], labelValue: string, displayName: string): LabelNode[] {
  return updateLabelAtPath(labels, labelValue, (label) => ({ ...label, displayName: displayName.trim() }));
}

export function setLabelAttributes(labels: LabelNode[], labelValue: string, attributes: LabelAttribute[]): LabelNode[] {
  return updateLabelAtPath(labels, labelValue, (label) => ({ ...label, attributes }));
}

export function setLabelEscalationEmail(labels: LabelNode[], labelValue: string, email: string): LabelNode[] {
  return updateLabelAtPath(labels, labelValue, (label) => ({
    ...label,
    attributes: setEscalationEmail(label.attributes, email),
  }));
}

export function removeLabel(labels: LabelNode[], labelValue: string): LabelNode[] {
  const labelPath = pathFromValue(labelValue);
  if (labelPath.length === 0) return labels;

  const removeAtPath = (items: LabelNode[], depth: number): LabelNode[] => {
    const indexAtDepth = labelPath[depth];
    if (depth === labelPath.length - 1) return items.filter((_, index) => index !== indexAtDepth);
    return items.map((item, index) =>
      index === indexAtDepth ? { ...item, labels: removeAtPath(item.labels ?? [], depth + 1) } : item
    );
  };

  return removeAtPath(labels, 0);
}

export function labelsForSave(labels: LabelNode[]): LabelNode[] {
  return labels.map((label) => {
    const saveLabel = { ...label } as LabelNode & { __key?: unknown };
    const children = saveLabel.labels;
    delete saveLabel.labels;
    delete saveLabel.isLeaf;
    delete saveLabel.resourcePath;
    delete saveLabel.__key;
    saveLabel.labels = children ? labelsForSave(children) : [];
    return saveLabel;
  });
}
