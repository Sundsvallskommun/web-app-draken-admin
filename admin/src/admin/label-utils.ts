import type { LabelNode } from '@admin/label-tree';

/** True if the node's name, or any descendant's name, contains the query. */
export function matchesSubtree(node: LabelNode, query: string): boolean {
  if (!query) return false;
  const name = (node.displayName || node.classification).toLowerCase();
  if (name.includes(query.toLowerCase())) return true;
  return node.labels?.some((c) => matchesSubtree(c, query)) ?? false;
}
