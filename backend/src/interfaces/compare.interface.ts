export interface CompareItem {
  identifier: string;
  name?: string;
  localVersion?: string;
  compareVersion?: string;
  differences?: string[];
  detail?: CompareDetail;
  templateType?: string;
}

export interface CompareDetail {
  localContent?: string;
  compareContent?: string;
  localMetadata?: string;
  compareMetadata?: string;
  localDefaultValues?: string;
  compareDefaultValues?: string;
}

export interface CompareResult {
  missingLocally: CompareItem[];
  missingInCompare: CompareItem[];
  different: CompareItem[];
}
