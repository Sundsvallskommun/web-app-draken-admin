import { apiServiceName } from '@/config/api-config';
import { CompareItem, CompareDetail, CompareResult } from '@/interfaces/compare.interface';
import { logger } from '@utils/logger';
import { DetailedTemplateResponse, TemplateResponse } from '@/data-contracts/templating/data-contracts';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import ApiService from '@/services/api.service';
import { getCompareApiService, isCompareConfigured } from '@/services/compare-api.service';
import { diffResources } from '@/utils/compare';
import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, Param, QueryParam, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

/**
 * CompareController — Environment comparison (e.g. prod vs test)
 *
 * HOW TO ADD A NEW RESOURCE COMPARISON
 * =====================================
 *
 * 1. BACKEND — Add a new endpoint in this controller:
 *
 *    @Get('/compare/myresource/:municipalityId')
 *    @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
 *    async compareMyResource(...) {
 *      const compareApiService = getCompareApiService();
 *      if (!compareApiService) return { data: null, message: 'Compare not configured' };
 *
 *      const [local, compare] = await Promise.all([
 *        this.fetchMyResource(this.apiService, municipalityId, req),
 *        this.fetchMyResource(compareApiService, municipalityId, req),
 *      ]);
 *
 *      // diffResources() matches items on `identifier` and compares the listed fields
 *      const result = diffResources(local, compare, [
 *        { field: 'version' },
 *        { field: 'name' },
 *        // Add fields relevant to your resource
 *        // Use { field: 'x', serialize: v => JSON.stringify(v) } for objects/arrays
 *      ]);
 *
 *      return { data: result, message: 'success' };
 *    }
 *
 * 2. FRONTEND — Create a compare page:
 *    - Copy `admin/src/pages/templates/compare.tsx` as a starting point
 *    - Change `fetchCompare('templates', ...)` to `fetchCompare('myresource', ...)`
 *    - Adjust table headers for your resource's fields
 *
 * 3. MENU — Add navigation in `admin/src/components/menu/menu.tsx`:
 *    - Add a conditional menu item similar to the templates compare entry
 *
 * Key files:
 *   - backend/src/utils/compare.ts          — Generic diffResources() function
 *   - backend/src/interfaces/compare.interface.ts — CompareItem/CompareResult types
 *   - backend/src/services/compare-api.service.ts — Compare environment ApiService factory
 *   - admin/src/services/compare-service.ts  — Frontend service (generic, works for any resource)
 */
@Controller()
export class CompareController {
  private apiService = new ApiService();
  private TEMPLATING = apiServiceName('templating');

  @Get('/compare/available')
  @OpenAPI({ summary: 'Check if environment comparison is configured' })
  @UseBefore(authMiddleware)
  async checkAvailable(): Promise<ApiResponse<{ available: boolean }>> {
    return { data: { available: isCompareConfigured() }, message: 'success' };
  }

  @Get('/compare/templates/:municipalityId')
  @OpenAPI({ summary: 'Compare templates between local and compare environment' })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  async compareTemplates(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<ApiResponse<CompareResult>> {
    const compareApiService = getCompareApiService();
    if (!compareApiService) {
      return { data: null, message: 'Compare environment is not configured' };
    }

    // Step 1: Fetch template lists from both environments
    const [localTemplates, compareTemplates] = await Promise.all([
      this.fetchTemplateList(this.apiService, municipalityId, namespace, req),
      this.fetchTemplateList(compareApiService, municipalityId, namespace, req),
    ]);

    const localMap = new Map(localTemplates.map(t => [t.identifier, t]));
    const compareMap = new Map(compareTemplates.map(t => [t.identifier, t]));

    const missingLocally: CompareItem[] = [];
    const missingInCompare: CompareItem[] = [];
    const different: CompareItem[] = [];

    for (const [id, t] of compareMap) {
      if (!localMap.has(id)) {
        missingLocally.push({ identifier: id, name: t.name, compareVersion: t.version, templateType: this.getTemplateType(t) });
      }
    }

    for (const [id, t] of localMap) {
      if (!compareMap.has(id)) {
        missingInCompare.push({ identifier: id, name: t.name, localVersion: t.version, templateType: this.getTemplateType(t) });
      }
    }

    // Step 2: For templates in both, fetch full content and deep-compare
    // Batch in groups of 5 to avoid rate limiting
    const sharedIdentifiers = [...localMap.keys()].filter(id => compareMap.has(id));
    const BATCH_SIZE = 5;

    for (let i = 0; i < sharedIdentifiers.length; i += BATCH_SIZE) {
      const batch = sharedIdentifiers.slice(i, i + BATCH_SIZE);

      const detailResults = await Promise.all(
        batch.map(async (identifier) => {
          try {
            const [local, compare] = await Promise.all([
              this.fetchTemplateDetail(this.apiService, municipalityId, identifier, req),
              this.fetchTemplateDetail(compareApiService, municipalityId, identifier, req),
            ]);
            return { identifier, local, compare, error: false };
          } catch (e) {
            logger.error(`Failed to fetch detail for template ${identifier}: ${e}`);
            return { identifier, local: null, compare: null, error: true };
          }
        }),
      );

      for (const { identifier, local, compare, error } of detailResults) {
        if (error || !local || !compare) {
          different.push({
            identifier,
            name: localMap.get(identifier)?.name,
            differences: ['error: kunde inte hämta detaljer'],
          });
          continue;
        }

        const localContent = this.decodeContent(local.content);
        const compareContent = this.decodeContent(compare.content);
        const localMetaSorted = this.sortByKey(local.metadata);
        const compareMetaSorted = this.sortByKey(compare.metadata);
        const localDefaultsSorted = this.sortByKey(local.defaultValues);
        const compareDefaultsSorted = this.sortByKey(compare.defaultValues);
        const localMeta = JSON.stringify(localMetaSorted, null, 2);
        const compareMeta = JSON.stringify(compareMetaSorted, null, 2);
        const localDefaults = JSON.stringify(localDefaultsSorted, null, 2);
        const compareDefaults = JSON.stringify(compareDefaultsSorted, null, 2);

        const differences: string[] = [];
        if (localContent !== compareContent) differences.push('content');
        if (localMeta !== compareMeta) differences.push('metadata');
        if (localDefaults !== compareDefaults) differences.push('defaultValues');

        if (differences.length > 0) {
          const detail: CompareDetail = {
            localContent,
            compareContent,
            localMetadata: localMeta,
            compareMetadata: compareMeta,
            localDefaultValues: localDefaults,
            compareDefaultValues: compareDefaults,
          };

          different.push({
            identifier,
            name: local.name,
            localVersion: local.version,
            compareVersion: compare.version,
            differences,
            detail,
            templateType: this.getTemplateType(localMap.get(identifier)),
          });
        }
      }
    }

    // Step 3: Fetch detail for templates missing locally (from compare env)
    for (let i = 0; i < missingLocally.length; i += BATCH_SIZE) {
      const batch = missingLocally.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (item) => {
          try {
            const detail = await this.fetchTemplateDetail(compareApiService, municipalityId, item.identifier, req);
            item.detail = {
              compareContent: this.decodeContent(detail.content),
              compareMetadata: JSON.stringify(this.sortByKey(detail.metadata), null, 2),
              compareDefaultValues: JSON.stringify(this.sortByKey(detail.defaultValues), null, 2),
            };
          } catch (e) {
            logger.error(`Failed to fetch detail for missing template ${item.identifier}: ${e}`);
          }
        }),
      );
    }

    return { data: { missingLocally, missingInCompare, different }, message: 'success' };
  }

  private async fetchTemplateList(
    service: ApiService,
    municipalityId: number,
    namespace: string | undefined,
    req: RequestWithUser,
  ): Promise<TemplateResponse[]> {
    const url = `${this.TEMPLATING}/${municipalityId}/templates/search?showOnlyLatest=true`;

    const filters: any[] = [{ eq: { application: 'draken' } }];

    if (namespace && namespace !== 'undefined') {
      filters.push({ or: [{ eq: { namespace } }] });
    }

    const res = await service.post<TemplateResponse[]>(
      { url, data: { and: filters } },
      req.user,
    );

    return res.data;
  }

  private getTemplateType(template: TemplateResponse): string {
    const entry = template?.metadata?.find(m => m.key === 'templateType');
    return entry?.value?.toLowerCase() ?? '';
  }

  private sortByKey<T extends { key?: string }>(arr?: T[]): T[] {
    if (!arr) return [];
    return [...arr].sort((a, b) => (a.key ?? '').localeCompare(b.key ?? ''));
  }

  private decodeContent(content?: string): string {
    if (!content) return '';
    try {
      return Buffer.from(content, 'base64').toString('utf-8');
    } catch {
      return content;
    }
  }

  private async fetchTemplateDetail(
    service: ApiService,
    municipalityId: number,
    identifier: string,
    req: RequestWithUser,
  ): Promise<DetailedTemplateResponse> {
    const url = `${this.TEMPLATING}/${municipalityId}/templates/${identifier}`;
    const res = await service.get<DetailedTemplateResponse>({ url }, req.user);
    return res.data;
  }
}
