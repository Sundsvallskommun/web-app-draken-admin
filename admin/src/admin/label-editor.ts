import type { LabelNode } from '@interfaces/label';

export const ROOT_PARENT_VALUE = '__root__';

const DEFAULT_CLASSIFICATIONS = ['CATEGORY', 'TYPE', 'SUBTYPE'] as const;

export interface LabelParentOption {
  value: string;
  label: string;
  depth: number;
}

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

  const visit = (items: LabelNode[], path: number[], names: string[]) => {
    items.forEach((item, index) => {
      const nextPath = [...path, index];
      const name = item.displayName || item.resourceName || item.classification;
      const nextNames = [...names, name];
      options.push({
        value: nextPath.join('.'),
        label: nextNames.join(' / '),
        depth: nextPath.length - 1,
      });
      visit(item.labels ?? [], nextPath, nextNames);
    });
  };

  visit(labels, [], []);
  return options;
}

export function appendLabel(labels: LabelNode[], parentValue: string, label: LabelNode): LabelNode[] {
  if (parentValue === ROOT_PARENT_VALUE) return [...labels, label];

  const parentPath = parentValue
    .split('.')
    .map((part) => Number(part))
    .filter((part) => Number.isInteger(part));

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

export function labelsForSave(labels: LabelNode[]): LabelNode[] {
  return labels.map(({ labels: children, ...label }) => {
    const saveLabel = { ...label, labels: children ? labelsForSave(children) : [] };
    delete saveLabel.isLeaf;
    return saveLabel;
  });
}
