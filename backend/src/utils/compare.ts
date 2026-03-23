import { CompareItem, CompareResult } from '@/interfaces/compare.interface';

interface Identifiable {
  identifier?: string;
  name?: string;
  version?: string;
}

export interface CompareFieldConfig {
  field: string;
  serialize?: (value: unknown) => string;
}

export function diffResources<T extends Identifiable>(
  localItems: T[],
  compareItems: T[],
  fieldsToCompare: CompareFieldConfig[],
): CompareResult {
  const localMap = new Map(localItems.map(item => [item.identifier, item]));
  const compareMap = new Map(compareItems.map(item => [item.identifier, item]));

  const missingLocally: CompareItem[] = [];
  const missingInCompare: CompareItem[] = [];
  const different: CompareItem[] = [];

  for (const [identifier, compareItem] of compareMap) {
    if (!localMap.has(identifier)) {
      missingLocally.push({
        identifier,
        name: compareItem.name,
        compareVersion: compareItem.version,
      });
    }
  }

  for (const [identifier, localItem] of localMap) {
    if (!compareMap.has(identifier)) {
      missingInCompare.push({
        identifier,
        name: localItem.name,
        localVersion: localItem.version,
      });
    }
  }

  for (const [identifier, localItem] of localMap) {
    const compareItem = compareMap.get(identifier);
    if (!compareItem) continue;

    const differences: string[] = [];
    for (const { field, serialize } of fieldsToCompare) {
      const localVal = serialize ? serialize(localItem[field]) : JSON.stringify(localItem[field]);
      const compareVal = serialize ? serialize(compareItem[field]) : JSON.stringify(compareItem[field]);
      if (localVal !== compareVal) {
        differences.push(field);
      }
    }

    if (differences.length > 0) {
      different.push({
        identifier,
        name: localItem.name,
        localVersion: localItem.version,
        compareVersion: compareItem.version,
        differences,
      });
    }
  }

  return { missingLocally, missingInCompare, different };
}
