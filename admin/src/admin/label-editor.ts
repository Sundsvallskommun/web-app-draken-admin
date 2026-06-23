import type { LabelNode } from '@interfaces/label';

export const ROOT_PARENT_VALUE = '__root__';

export const LABEL_CLASSIFICATION_OPTIONS = ['CATEGORY', 'TYPE', 'SUBTYPE'] as const;

export interface LabelParentOption {
  value: string;
  label: string;
  depth: number;
}

export interface LabelPathEntry {
  node: LabelNode;
  pathValue: string;
}

export interface LabelSubtreeEntry {
  node: LabelNode;
  depth: number;
  key: string;
}

export type LabelMoveError =
  | 'missing-source'
  | 'missing-target'
  | 'root-target-unsupported'
  | 'deeper-level'
  | 'same-parent'
  | 'missing-classification';

export interface LabelMovePreview {
  before: LabelNode[];
  after: LabelNode[];
  movedLabel: LabelNode;
  movedLabelKey: string;
  movedLabelKeys: string[];
  targetParent: LabelNode;
  sourceLevel: number;
  targetLevel: number;
  classification: string;
}

export type LabelMovePreviewResult = { ok: true; preview: LabelMovePreview } | { ok: false; reason: LabelMoveError };

const labelIdentity = (label: LabelNode): string =>
  label.id ? `id:${label.id}` : `${label.classification}\u0000${label.resourceName}\u0000${label.displayName ?? ''}`;

export const labelReferenceKey = (label: LabelNode): string =>
  label.id ? `id:${label.id}` : `resource:${label.resourceName}\u0000${label.displayName ?? ''}`;

export function flattenLabelSubtree(label: LabelNode, depth = 0): LabelSubtreeEntry[] {
  return [
    { node: label, depth, key: labelReferenceKey(label) },
    ...(label.labels ?? []).flatMap((child) => flattenLabelSubtree(child, depth + 1)),
  ];
}

export function labelSubtreeReferenceKeys(label: LabelNode): string[] {
  return flattenLabelSubtree(label).map((entry) => entry.key);
}

export function defaultClassificationForDepth(depth: number): string {
  return LABEL_CLASSIFICATION_OPTIONS[depth] ?? LABEL_CLASSIFICATION_OPTIONS[LABEL_CLASSIFICATION_OPTIONS.length - 1];
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

export function rehydrateLabelPath(labels: LabelNode[], path: LabelPathEntry[]): LabelPathEntry[] {
  const nextPath: LabelPathEntry[] = [];
  let siblings = labels;
  let parentPath = '';

  for (const entry of path) {
    const nextIndex = siblings.findIndex((label) => labelIdentity(label) === labelIdentity(entry.node));
    if (nextIndex === -1) break;

    const nextNode = siblings[nextIndex];
    const nextPathValue = parentPath ? `${parentPath}.${nextIndex}` : String(nextIndex);
    nextPath.push({ node: nextNode, pathValue: nextPathValue });
    siblings = nextNode.labels ?? [];
    parentPath = nextPathValue;
  }

  return nextPath;
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

interface MoveLabelInput {
  sourceValue: string;
  targetParentValue: string;
  classification: string;
}

const pathFromValue = (value: string): number[] =>
  value
    .split('.')
    .map((part) => Number(part))
    .filter((part) => Number.isInteger(part));

export function parentValueForLabelValue(labelValue: string): string {
  const path = pathFromValue(labelValue);
  if (path.length <= 1) return ROOT_PARENT_VALUE;
  return path.slice(0, -1).join('.');
}

const labelAtPath = (labels: LabelNode[], path: number[]): LabelNode | undefined =>
  path.reduce<LabelNode | undefined>(
    (current, index, depth) => (depth === 0 ? labels[index] : current?.labels?.[index]),
    undefined
  );

function extractLabel(labels: LabelNode[], sourcePath: number[]) {
  const moved = labelAtPath(labels, sourcePath);
  if (!moved) return undefined;
  return { moved, labels: removeLabel(labels, sourcePath.join('.')) };
}

function prepareLabelMove(labels: LabelNode[], input: MoveLabelInput): LabelMovePreviewResult {
  const sourcePath = pathFromValue(input.sourceValue);
  const classification = input.classification.trim();

  if (sourcePath.length === 0) return { ok: false, reason: 'missing-source' };
  if (!classification) return { ok: false, reason: 'missing-classification' };
  if (input.targetParentValue === ROOT_PARENT_VALUE) return { ok: false, reason: 'root-target-unsupported' };

  const movedLabel = labelAtPath(labels, sourcePath);
  if (!movedLabel) return { ok: false, reason: 'missing-source' };

  const targetParentPath = pathFromValue(input.targetParentValue);
  const sourceLevel = sourcePath.length - 1;
  const targetLevel = targetParentPath.length;
  const targetParent = labelAtPath(labels, targetParentPath);

  if (targetLevel > sourceLevel) return { ok: false, reason: 'deeper-level' };
  if (input.targetParentValue === parentValueForLabelValue(input.sourceValue)) {
    return { ok: false, reason: 'same-parent' };
  }
  if (!targetParent) return { ok: false, reason: 'missing-target' };

  const extracted = extractLabel(labels, sourcePath);
  if (!extracted) return { ok: false, reason: 'missing-source' };

  const after = appendLabel(extracted.labels, input.targetParentValue, {
    ...extracted.moved,
    classification,
  });

  return {
    ok: true,
    preview: {
      before: labels,
      after,
      movedLabel,
      movedLabelKey: labelReferenceKey(movedLabel),
      movedLabelKeys: labelSubtreeReferenceKeys(movedLabel),
      targetParent,
      sourceLevel,
      targetLevel,
      classification,
    },
  };
}

export function buildLabelMovePreview(labels: LabelNode[], input: MoveLabelInput): LabelMovePreviewResult {
  return prepareLabelMove(labels, input);
}

export function moveLabelBackward(labels: LabelNode[], input: MoveLabelInput): LabelNode[] {
  const preview = buildLabelMovePreview(labels, input);
  if (!preview.ok) return labels;
  return preview.preview.after;
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
    const childLabels = children ? labelsForSave(children) : [];
    if (childLabels.length > 0) saveLabel.labels = childLabels;
    return saveLabel;
  });
}
