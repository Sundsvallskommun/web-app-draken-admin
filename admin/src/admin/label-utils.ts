import type { LabelPathEntry } from '@admin/label-editor';
import type { LabelNode } from '@interfaces/label';

const normalizedQuery = (query: string): string => query.trim().toLocaleLowerCase('sv');

const labelName = (node: LabelNode): string => node.displayName || node.classification;

export function matchesLabel(node: LabelNode, query: string): boolean {
  const normalized = normalizedQuery(query);
  if (!normalized) return false;
  return labelName(node).toLocaleLowerCase('sv').includes(normalized);
}

/** True if the node or any descendant matches the query. */
export function matchesSubtree(node: LabelNode, query: string): boolean {
  if (matchesLabel(node, query)) return true;
  return node.labels?.some((c) => matchesSubtree(c, query)) ?? false;
}

export interface LabelTreeEntry {
  node: LabelNode;
  index: number;
}

/** Filters one tree level without changing the original indexes used by label actions. */
export function visibleLabelEntries(labels: LabelNode[], query: string): LabelTreeEntry[] {
  return labels
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => !normalizedQuery(query) || matchesSubtree(node, query));
}

export interface LabelSearchResult {
  node: LabelNode;
  pathValue: string;
  path: LabelPathEntry[];
  breadcrumb: string;
}

/** Returns direct matches with their original tree paths so actions target the correct label. */
export function findLabelMatches(labels: LabelNode[], query: string): LabelSearchResult[] {
  if (!normalizedQuery(query)) return [];

  const results: LabelSearchResult[] = [];

  const visit = (items: LabelNode[], parentPath: string, parentEntries: LabelPathEntry[]) => {
    items.forEach((node, index) => {
      const pathValue = parentPath ? `${parentPath}.${index}` : String(index);
      const path = [...parentEntries, { node, pathValue }];

      if (matchesLabel(node, query)) {
        results.push({
          node,
          pathValue,
          path,
          breadcrumb: path.map((entry) => labelName(entry.node)).join(' / '),
        });
      }

      visit(node.labels ?? [], pathValue, path);
    });
  };

  visit(labels, '', []);
  return results;
}
