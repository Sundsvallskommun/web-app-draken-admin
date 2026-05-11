import resources from '@config/resources';
import DefaultLayout from '@layouts/default-layout/default-layout.component';
import { Header } from '@layouts/header/header.component';
import Main from '@layouts/main/main.component';
import { AutoTable, AutoTableHeader, Badge, Button, FormControl, FormLabel, Select, Spinner, useConfirm, useSnackbar } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { getMetadataValue } from '@utils/template-metadata';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Known templateType values and their correct PascalCase form.
 * Add new types here as needed.
 */
const EXPECTED_TYPES: Record<string, string> = {
  decision: 'Decision',
  email: 'Email',
  sms: 'Sms',
  investigation: 'Investigation',
  investigationphrases: 'InvestigationPhrases',
};

/** Returns the expected PascalCase form, or capitalize-first as fallback for unknown types. */
function toExpectedCase(raw: string): string {
  const lookup = EXPECTED_TYPES[raw.toLowerCase()];
  if (lookup) return lookup;
  // Fallback: capitalize first letter
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

interface CaseIssue {
  identifier: string;
  name: string;
  rawTemplateType: string;
  expectedType: string;
}

interface DecisionTemplateInfo {
  identifier: string;
  name: string;
  decisionValue: string;
  hasDecisionKey: boolean;
}

interface PatchResult {
  identifier: string;
  success: boolean;
  error?: string;
}

export const TemplateCaseAudit: React.FC = () => {
  const resource = 'templates';
  const { municipalityId } = useLocalStorage();

  const { data, loaded, refresh } = useResource(resource);
  const { getOne, update } = resources[resource];
  const message = useSnackbar();
  const confirm = useConfirm();

  const [filterType, setFilterType] = useState<string>('');
  const [isPatching, setIsPatching] = useState(false);
  const [patchProgress, setPatchProgress] = useState({ current: 0, total: 0 });
  const [patchResults, setPatchResults] = useState<PatchResult[]>([]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analysis = useMemo(() => {
    if (!data) return { issues: [] as CaseIssue[], typeMap: new Map<string, Set<string>>() };

    const typeMap = new Map<string, Set<string>>();

    data.forEach((item) => {
      const raw = getMetadataValue(item.metadata, 'templateType') ?? '';
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!typeMap.has(key)) {
        typeMap.set(key, new Set());
      }
      typeMap.get(key)!.add(raw);
    });

    // Find templates where raw value doesn't match expected PascalCase
    const issues: CaseIssue[] = [];
    data.forEach((item) => {
      const raw = getMetadataValue(item.metadata, 'templateType') ?? '';
      if (!raw) return;
      const expected = toExpectedCase(raw);
      if (raw !== expected) {
        issues.push({
          identifier: item.identifier ?? '',
          name: item.name ?? '',
          rawTemplateType: raw,
          expectedType: expected,
        });
      }
    });

    // Map all Decision templates and their "decision" metadata key
    const decisionTemplates: DecisionTemplateInfo[] = [];
    data.forEach((item) => {
      const rawType = getMetadataValue(item.metadata, 'templateType') ?? '';
      if (rawType.toLowerCase() !== 'decision') return;

      const decisionValue = getMetadataValue(item.metadata, 'decision') ?? '';

      decisionTemplates.push({
        identifier: item.identifier ?? '',
        name: item.name ?? '',
        decisionValue,
        hasDecisionKey: !!decisionValue,
      });
    });

    return { issues, typeMap, decisionTemplates };
  }, [data]);

  const filteredIssues = useMemo(
    () => (filterType ? analysis.issues.filter((i) => i.expectedType === filterType) : analysis.issues),
    [analysis.issues, filterType]
  );

  const patchTemplate = useCallback(
    async (identifier: string): Promise<PatchResult> => {
      try {
        if (!getOne || !update) {
          return { identifier, success: false, error: 'Resource methods not available' };
        }

        const res = await getOne(municipalityId, identifier);
        const template = res.data.data;

        if (!template) {
          return { identifier, success: false, error: 'Could not fetch template' };
        }

        let metadataArray: Array<{ key: string; value: string }> = [];
        if (typeof template.metadata === 'string') {
          metadataArray = JSON.parse(template.metadata || '[]');
        } else if (Array.isArray(template.metadata)) {
          metadataArray = [...template.metadata];
        }

        const fixedMetadata = metadataArray.map((entry) => {
          if (entry.key === 'templateType') {
            const expected = toExpectedCase(entry.value);
            if (entry.value !== expected) {
              return { ...entry, value: expected };
            }
          }
          return entry;
        });

        await update(municipalityId, identifier, {
          ...template,
          metadata: JSON.stringify(fixedMetadata, null, 2),
          versionIncrement: 'MINOR',
          changeLog: 'Fix templateType casing to PascalCase',
        });

        return { identifier, success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { identifier, success: false, error: message };
      }
    },
    [getOne, update, municipalityId]
  );

  const handlePatchAll = useCallback(async () => {
    const issuesToFix = filterType
      ? analysis.issues.filter((i) => i.expectedType === filterType)
      : analysis.issues;

    if (issuesToFix.length === 0) return;

    const confirmed = await confirm.showConfirmation(
      'Bekräfta',
      `Detta skapar en ny MINOR-version för ${issuesToFix.length} mall(ar) med fixad templateType (PascalCase). Vill du fortsätta?`,
      'Ja, fixa alla',
      'Avbryt',
    );

    if (!confirmed) return;

    setIsPatching(true);
    setPatchProgress({ current: 0, total: issuesToFix.length });
    setPatchResults([]);

    const results: PatchResult[] = [];

    for (const issue of issuesToFix) {
      const result = await patchTemplate(issue.identifier);
      results.push(result);
      setPatchProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      setPatchResults([...results]);
    }

    setIsPatching(false);

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (failed === 0) {
      message({ message: `Klart! ${succeeded} mall(ar) uppdaterade.`, status: 'success' });
    } else {
      message({ message: `${succeeded} lyckades, ${failed} misslyckades. Se loggen nedan.`, status: 'error' });
    }

    refresh();
  }, [analysis.issues, filterType, confirm, patchTemplate, message, refresh]);

  const handlePatchSingle = useCallback(
    async (identifier: string) => {
      const issue = analysis.issues.find((i) => i.identifier === identifier);
      const expected = issue?.expectedType ?? '?';

      const confirmed = await confirm.showConfirmation(
        'Bekräfta',
        `Skapa en ny MINOR-version av "${identifier}" med templateType "${expected}"?`,
        'Ja, fixa',
        'Avbryt',
      );

      if (!confirmed) return;

      setIsPatching(true);
      const result = await patchTemplate(identifier);
      setIsPatching(false);

      if (result.success) {
        message({ message: `"${identifier}" uppdaterad!`, status: 'success' });
      } else {
        message({ message: `Misslyckades: ${result.error}`, status: 'error' });
      }

      refresh();
    },
    [analysis.issues, confirm, patchTemplate, message, refresh]
  );

  const headers: AutoTableHeader[] = [
    {
      property: 'identifier',
      label: 'Identifier',
      isColumnSortable: true,
      renderColumn: (value: string) => (
        <NextLink href={`/templates/${value}`} className="underline">
          {value}
        </NextLink>
      ),
    },
    { property: 'name', label: 'Namn', isColumnSortable: true },
    {
      property: 'rawTemplateType',
      label: 'Nuvarande värde',
      isColumnSortable: true,
      renderColumn: (value: string) => <Badge color="error">{value}</Badge>,
    },
    {
      property: 'expectedType',
      label: 'Förväntat (PascalCase)',
      isColumnSortable: true,
      renderColumn: (value: string) => <Badge color="gronsta">{value}</Badge>,
    },
    {
      property: 'identifier',
      label: '',
      renderColumn: (value: string) => (
        <Button size="sm" variant="tertiary" disabled={isPatching} onClick={() => handlePatchSingle(value)}>
          Fixa
        </Button>
      ),
    },
  ];

  return (
    <DefaultLayout>
      <Main>
        <Header>
          <h1 className="text-h2-md">Malltyp case-audit (TEMP)</h1>
        </Header>

        <div className="my-lg">
          {!loaded ? (
            <Spinner />
          ) : (
            <>
              {/* Summary */}
              <div className="mb-lg p-md rounded bg-background-200">
                <h2 className="text-h3-sm mb-sm">Sammanfattning</h2>
                <p className="mb-sm">
                  Totalt antal mallar: <strong>{data?.length ?? 0}</strong>
                </p>
                <p className="mb-sm">
                  Mallar med felaktig casing: <strong>{analysis.issues.length}</strong>
                </p>

                {analysis.typeMap && (
                  <div className="mt-md">
                    <h3 className="text-h4-sm mb-sm">Alla templateType-värden (rå → förväntat):</h3>
                    <ul className="list-disc pl-lg">
                      {Array.from(analysis.typeMap.entries())
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, variants]) => {
                          const expected = toExpectedCase(key);
                          const allCorrect = variants.size === 1 && variants.has(expected);
                          return (
                            <li key={key}>
                              <strong>{expected}</strong>:{' '}
                              {Array.from(variants)
                                .map((v) => `"${v}"`)
                                .join(', ')}
                              {allCorrect ? (
                                <Badge className="ml-sm" color="gronsta">OK</Badge>
                              ) : (
                                <Badge className="ml-sm" color="error">FIXA</Badge>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Filter + Patch actions */}
              {analysis.issues.length > 0 && (
                <>
                  <div className="mb-md flex items-end gap-md">
                    <FormControl>
                      <FormLabel>Filtrera på typ</FormLabel>
                      <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <Select.Option value="">Alla med problem ({analysis.issues.length})</Select.Option>
                        {Array.from(new Set(analysis.issues.map((i) => i.expectedType)))
                          .sort()
                          .map((type) => {
                            const count = analysis.issues.filter((i) => i.expectedType === type).length;
                            return (
                              <Select.Option value={type} key={type}>
                                {type} ({count})
                              </Select.Option>
                            );
                          })}
                      </Select>
                    </FormControl>

                    <Button color="primary" disabled={isPatching} onClick={handlePatchAll}>
                      {isPatching
                        ? `Patchar... (${patchProgress.current}/${patchProgress.total})`
                        : `Fixa alla (${filteredIssues.length})`}
                    </Button>
                  </div>

                  <AutoTable autodata={filteredIssues} autoheaders={headers} />
                </>
              )}

              {analysis.issues.length === 0 && (
                <p className="text-lg text-content-secondary">
                  Inga case-problem hittade! Alla templateType-värden har korrekt PascalCase.
                </p>
              )}

              {/* Decision metadata overview */}
              {analysis.decisionTemplates && analysis.decisionTemplates.length > 0 && (
                <div className="mt-xl mb-lg p-md rounded bg-background-200">
                  <h2 className="text-h3-sm mb-sm">Decision-mallar — metadata &quot;decision&quot;</h2>
                  <p className="mb-md text-content-secondary">
                    Mallar med templateType &quot;Decision&quot; behöver en metadata-nyckel <strong>decision</strong> för
                    att kunna filtreras i beslutsvyn (t.ex. APPROVAL, REJECTION).
                  </p>
                  <AutoTable
                    autodata={analysis.decisionTemplates}
                    autoheaders={[
                      {
                        property: 'identifier',
                        label: 'Identifier',
                        isColumnSortable: true,
                        renderColumn: (value: string) => (
                          <NextLink href={`/templates/${value}`} className="underline">
                            {value}
                          </NextLink>
                        ),
                      },
                      { property: 'name', label: 'Namn', isColumnSortable: true },
                      {
                        property: 'decisionValue',
                        label: 'decision-värde',
                        isColumnSortable: true,
                        renderColumn: (value: string) =>
                          value ? (
                            <Badge color="gronsta">{value}</Badge>
                          ) : (
                            <Badge color="error">SAKNAS</Badge>
                          ),
                      },
                    ]}
                  />
                </div>
              )}

              {/* Patch results log */}
              {patchResults.length > 0 && (
                <div className="mt-lg p-md rounded bg-background-200">
                  <h3 className="text-h4-sm mb-sm">Resultat</h3>
                  <ul className="list-disc pl-lg">
                    {patchResults.map((r) => (
                      <li key={r.identifier}>
                        <strong>{r.identifier}</strong>:{' '}
                        {r.success ? (
                          <Badge color="gronsta">OK</Badge>
                        ) : (
                          <Badge color="error">FEL: {r.error}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </Main>
    </DefaultLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default TemplateCaseAudit;
