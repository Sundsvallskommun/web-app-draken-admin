import { MUNICIPALITY_ID } from '@/config';
import { apiServiceName } from '@/config/api-config';
import { DetailedTemplateResponse, RenderResponse, TemplateRequest, TemplateResponse } from '@/data-contracts/templating/data-contracts';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { DetailedTemplateResponseDTO } from '@/responses/template.response';
import ApiService from '@/services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Body, Controller, Get, Param, Post, QueryParam, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

const toVersionParts = (version?: string): number[] => {
  if (!version) {
    return [];
  }

  return version.split('.').map(segment => {
    const parsed = Number.parseInt(segment, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
};

const compareVersions = (first?: string, second?: string): number => {
  const firstParts = toVersionParts(first);
  const secondParts = toVersionParts(second);
  const length = Math.max(firstParts.length, secondParts.length);

  for (let idx = 0; idx < length; idx++) {
    const diff = (firstParts[idx] ?? 0) - (secondParts[idx] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
};

const isTemplateNewer = (candidate: TemplateResponse, existing: TemplateResponse): boolean => {
  const versionDiff = compareVersions(candidate.version, existing.version);
  return versionDiff > 0;
};

const getLatestTemplates = (templates: TemplateResponse[]): TemplateResponse[] => {
  return Object.values(
    templates.reduce(
      (acc, template) => {
        const key = template.identifier ?? template.name;
        if (!key) {
          return acc;
        }

        const existing = acc[key];
        if (!existing || isTemplateNewer(template, existing)) {
          acc[key] = template;
        }

        return acc;
      },
      {} as Record<string, TemplateResponse>,
    ),
  );
};

const matchesMetadata = (template: TemplateResponse, metadataKey?: string, metadataValue?: string): boolean => {
  if (!metadataKey && !metadataValue) {
    return true;
  }

  return (template.metadata ?? []).some(entry => {
    const keyMatches = metadataKey ? entry.key === metadataKey : true;
    const valueMatches = metadataValue ? entry.value === metadataValue : true;
    return keyMatches && valueMatches;
  });
};

@Controller()
export class TemplateController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('templating');

  @Get('/templates/:municipalityId')
  @OpenAPI({ summary: 'Get the latest version of templates' })
  @UseBefore(authMiddleware)
  async GetAllTemplates(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
    @QueryParam('metadataKey') metadataKey?: string,
    @QueryParam('metadataValue') metadataValue?: string,
  ): Promise<ApiResponse<TemplateResponse[]>> {
    const url = `${this.SERVICE}/${municipalityId}/templates/search`;

    const filters: any[] = [{ eq: { application: 'draken' } }];

    if (namespace && namespace !== 'undefined') {
      filters.push({
        or: [{ eq: { namespace } }],
      });
    }

    const res = await this.apiService.post<TemplateResponse[]>(
      {
        url,
        data: {
          and: filters,
        },
      },
      req.user,
    );

    const templates = res.data;
    const latestTemplates = getLatestTemplates(templates);
    const filteredTemplates = latestTemplates.filter(template => matchesMetadata(template, metadataKey, metadataValue));

    const data = filteredTemplates.map((template, idx) => ({
      ...template,
      id: idx + 1,
    }));

    return { data, message: 'success' };
  }

  @Get('/templates/:municipalityId/:identifier')
  @OpenAPI({ summary: 'Get the latest version of a template by identifier, including content' })
  @UseBefore(authMiddleware)
  async GetTemplateUsingIdentifier(
    @Param('municipalityId') municipalityId: number,
    @Param('identifier') identifier: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<DetailedTemplateResponseDTO>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/templates/${identifier}`;
      const res = await this.apiService.get<DetailedTemplateResponse>({ url }, req.user);

      let decodedContent = res.data.content;
      if (decodedContent && typeof decodedContent === 'string') {
        decodedContent = Buffer.from(decodedContent, 'base64').toString();
      }

      return {
        data: {
          ...res.data,
          content: decodedContent,
          metadata: JSON.stringify(res.data.metadata, null, 2),
          defaultValues: JSON.stringify(res.data.defaultValues, null, 2),
        },
        message: 'success',
      };
    } catch (error: any) {
      console.error('Error fetching template:', error);

      return {
        data: null,
        message: error?.message || 'Failed to fetch template',
      };
    }
  }

  @Post('/templates/render')
  @OpenAPI({ summary: 'Render pdf preview of decision from passed in template string' })
  @UseBefore(authMiddleware)
  async PreviewDirectPdf(@Req() req: RequestWithUser, @Body() templateContent: string): Promise<ApiResponse<RenderResponse>> {
    const url = `${this.SERVICE}/${MUNICIPALITY_ID}/render/direct/pdf`;
    const response = await this.apiService.post<RenderResponse>({ url, data: templateContent }, req.user).catch(e => {
      throw e;
    });
    return { data: response.data, message: `PDF rendered` };
  }

  @Post('/templates/:municipalityId')
  @OpenAPI({ summary: 'Store a template' })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  async decisionPreviewDirectPdf(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Body() template: DetailedTemplateResponseDTO,
  ): Promise<ApiResponse<DetailedTemplateResponseDTO>> {
    const url = `${this.SERVICE}/${municipalityId}/templates`;

    let parsedMetadata = template.metadata;
    let parsedDefaultValues = template.defaultValues;
    try {
      if (typeof parsedMetadata === 'string') {
        parsedMetadata = JSON.parse(parsedMetadata);
      }
      if (typeof parsedDefaultValues === 'string') {
        parsedDefaultValues = JSON.parse(parsedDefaultValues);
      }

      const encodedTemplate = {
        ...template,
        metadata: parsedMetadata,
        defaultValues: parsedDefaultValues,
        content: typeof template.content === 'string' ? Buffer.from(template.content, 'utf-8').toString('base64') : template.content,
      };

      const response = await this.apiService.post<TemplateRequest>({ url, data: encodedTemplate }, req.user).catch(e => {
        throw e;
      });

      const data = {
        ...response.data,
        content: template.content,
        metadata: JSON.stringify(response.data.metadata, null, 2),
        defaultValues: JSON.stringify(response.data.defaultValues, null, 2),
      };

      return { data: data, message: `success` };
    } catch (error: any) {
      console.error('Error storing template:', error);

      return {
        data: null,
        message: error?.message || 'Failed to store template',
      };
    }
  }
}
