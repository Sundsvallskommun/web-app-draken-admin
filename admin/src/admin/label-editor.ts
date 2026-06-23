import type { LabelNode } from '@interfaces/label';

export const ROOT_PARENT_VALUE = '__root__';

const DEFAULT_CLASSIFICATIONS = ['CATEGORY', 'TYPE', 'SUBTYPE'] as const;

export interface LabelParentOption {
  value: string;
  label: string;
  depth: number;
}

const pathFromValue = (value: string): number[] =>
  value
    .split('.')
    .map((part) => Number(part))
    .filter((part) => Number.isInteger(part));

export function defaultClassificationForDepth(depth: number): string {
  return DEFAULT_CLASSIFICATIONS[depth] ?? DEFAULT_CLASSIFICATIONS[DEFAULT_CLASSIFICATIONS.length - 1];
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
  const options: LabelParentOption[] = [{ value: ROOT_PARENT_VALUE, label: 'Rotnivå', depth: -1 }];

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
        depth: nextPath.length - 1,
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

export function setLabelDeprecated(labels: LabelNode[], labelValue: string, deprecated: boolean): LabelNode[] {
  const labelPath = pathFromValue(labelValue);
  if (labelPath.length === 0) return labels;

  const updateAtPath = (items: LabelNode[], depth: number): LabelNode[] =>
    items.map((item, index) => {
      if (index !== labelPath[depth]) return item;
      if (depth === labelPath.length - 1) return applyDeprecatedToSubtree(item, deprecated);
      return { ...item, labels: updateAtPath(item.labels ?? [], depth + 1) };
    });

  return updateAtPath(labels, 0);
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
