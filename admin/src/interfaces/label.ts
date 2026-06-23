export interface LabelAttribute {
  key: string;
  value: string;
}

export interface LabelNode {
  id?: string;
  classification: string;
  displayName?: string;
  resourceName: string;
  resourcePath?: string;
  isLeaf?: boolean;
  deprecated?: boolean;
  labels?: LabelNode[];
  attributes?: LabelAttribute[];
}
