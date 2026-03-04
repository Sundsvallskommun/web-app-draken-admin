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
  ): Promise<ApiResponse<TemplateResponse[]>> {
    const url = `${this.SERVICE}/${municipalityId}/templates/search?showOnlyLatest=true`;

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

    const data = templates.map((template, idx) => ({
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
