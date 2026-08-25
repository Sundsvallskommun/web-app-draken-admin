import { normalizeTemplateMetadataForDiff } from '@utils/template-metadata-diff';

describe('normalizeTemplateMetadataForDiff', () => {
  it('keeps multiple values for the same key but ignores order and duplicate key/value pairs', () => {
    const local = normalizeTemplateMetadataForDiff([
      { key: 'caseOrigin', value: 'OpenE' },
      { key: 'caseOrigin', value: 'HGUI' },
      { key: 'caseOrigin', value: 'HGUI' },
      { key: 'caseOrigin', value: 'OpenE' },
    ]);
    const compare = normalizeTemplateMetadataForDiff([
      { key: 'caseOrigin', value: 'HGUI' },
      { key: 'caseOrigin', value: 'OpenE' },
    ]);

    expect(local).toEqual(compare);
    expect(local).toEqual([
      { key: 'caseOrigin', value: 'HGUI' },
      { key: 'caseOrigin', value: 'OpenE' },
    ]);
  });

  it('keeps genuinely different values visible in the normalized diff payload', () => {
    expect(normalizeTemplateMetadataForDiff([{ key: 'caseOrigin', value: 'OpenE' }])).not.toEqual(
      normalizeTemplateMetadataForDiff([{ key: 'caseOrigin', value: 'HGUI' }]),
    );
  });

  it('removes test approval metadata before comparing environments', () => {
    expect(
      normalizeTemplateMetadataForDiff([
        { key: 'templateType', value: 'Decision' },
        { key: 'testStatus', value: 'approved' },
        { key: 'testApprovedAt', value: '2026-06-02T09:25:07.000Z' },
      ]),
    ).toEqual([{ key: 'templateType', value: 'Decision' }]);
  });
});
