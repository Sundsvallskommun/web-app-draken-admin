import { labelReferenceKey, type LabelMovePreview } from '@admin/label-editor';
import type { LabelNode } from '@interfaces/label';

const LABEL_DEBUG_STORAGE_KEY = 'draken-admin:debug-labels';

interface FlatLabelRow {
  key: string;
  depth: number;
  id?: string;
  classification: string;
  displayName?: string;
  resourceName: string;
  resourcePath?: string;
  childCount: number;
}

export function syncLabelDebugFlagFromUrl() {
  if (typeof window === 'undefined') return;
  const value = new URLSearchParams(window.location.search).get('debugLabels')?.toLowerCase();
  if (!value) return;

  if (['1', 'true', 'on'].includes(value)) {
    window.localStorage.setItem(LABEL_DEBUG_STORAGE_KEY, 'true');
    console.info('[labels:debug] Påslaget. Stäng av med ?debugLabels=0.');
  } else if (['0', 'false', 'off'].includes(value)) {
    window.localStorage.removeItem(LABEL_DEBUG_STORAGE_KEY);
    console.info('[labels:debug] Avstängt.');
  }
}

export function isLabelDebugEnabled() {
  return typeof window !== 'undefined' && window.localStorage.getItem(LABEL_DEBUG_STORAGE_KEY) === 'true';
}

const snapshot = <T>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
};

const flattenLabels = (labels: LabelNode[], depth = 0): FlatLabelRow[] =>
  labels.flatMap((label) => [
    {
      key: labelReferenceKey(label),
      depth,
      id: label.id,
      classification: label.classification,
      displayName: label.displayName,
      resourceName: label.resourceName,
      resourcePath: label.resourcePath,
      childCount: label.labels?.length ?? 0,
    },
    ...flattenLabels(label.labels ?? [], depth + 1),
  ]);

const rowsForMovedLabels = (labels: LabelNode[], movedLabelKeys: string[]) => {
  const moved = new Set(movedLabelKeys);
  return flattenLabels(labels).filter((row) => moved.has(row.key));
};

export function labelListFromApiResponse(value: unknown): LabelNode[] {
  if (Array.isArray(value)) return value as LabelNode[];
  if (!value || typeof value !== 'object') return [];

  const maybeResponse = value as { data?: unknown };
  return Array.isArray(maybeResponse.data) ? (maybeResponse.data as LabelNode[]) : [];
}

export function logLabelMoveValidation({
  namespace,
  municipalityId,
  preview,
  putPayload,
  putResponse,
  getResponse,
}: {
  namespace: string;
  municipalityId: number;
  preview: LabelMovePreview;
  putPayload: LabelNode[];
  putResponse: LabelNode[];
  getResponse: LabelNode[];
}) {
  if (!isLabelDebugEnabled()) return;

  const movedName =
    preview.movedLabel.displayName || preview.movedLabel.resourceName || preview.movedLabel.classification;
  const beforeRows = rowsForMovedLabels(preview.before, preview.movedLabelKeys);
  const putPayloadRows = rowsForMovedLabels(putPayload, preview.movedLabelKeys);
  const putResponseRows = rowsForMovedLabels(putResponse, preview.movedLabelKeys);
  const getResponseRows = rowsForMovedLabels(getResponse, preview.movedLabelKeys);
  const summaryRows = [
    { step: 'before', rows: beforeRows },
    { step: 'putPayload', rows: putPayloadRows },
    { step: 'putResponse', rows: putResponseRows },
    { step: 'getAfterRefresh', rows: getResponseRows },
  ].map(({ step, rows }) => ({
    step,
    count: rows.length,
    ids: rows
      .map((row) => row.id)
      .filter(Boolean)
      .join(', '),
    resourcePaths: rows
      .map((row) => row.resourcePath)
      .filter(Boolean)
      .join(', '),
  }));

  console.groupCollapsed(`[labels:move] ${namespace} / ${movedName}`);
  console.info('Validera att samma id finns i before, PUT payload, PUT response och GET efter refresh.');
  if (putResponse.length === 0) {
    console.info('PUT response saknade labelStructure. Använd GET efter refresh som backend-sanning.');
  }
  console.table(summaryRows);
  console.log('Flyttade labels före', snapshot(beforeRows));
  console.log('Flyttade labels i PUT payload', snapshot(putPayloadRows));
  console.log('Flyttade labels i PUT response', snapshot(putResponseRows));
  console.log('Flyttade labels i GET efter refresh', snapshot(getResponseRows));
  console.log('PUT labelStructure payload', snapshot(putPayload));
  console.log('PUT response labelStructure', snapshot(putResponse));
  console.log('GET labelStructure efter refresh', snapshot(getResponse));
  console.log('Context', snapshot({ municipalityId, namespace, preview }));
  console.groupEnd();
}
