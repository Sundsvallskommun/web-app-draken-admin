export interface LabelNode {
  id?: string;
  classification: string;
  displayName?: string;
  resourceName: string;
  resourcePath?: string;
  isLeaf?: boolean;
  labels?: LabelNode[];
}
