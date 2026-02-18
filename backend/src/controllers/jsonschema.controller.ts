import { apiServiceName } from '@/config/api-config';
import { JsonSchemaEntity, PageJsonSchema, UiSchemaEntity } from '@/data-contracts/jsonschema/data-contracts';
import { JsonSchemaRequestDto, UiSchemaRequestDto } from '@/dtos/jsonschema.dto';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { JsonSchemaResponseDTO, UiSchemaResponseDTO } from '@/responses/jsonschema.response';
import ApiService from '@/services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Body, Controller, Delete, Get, Param, Post, Put, QueryParam, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

@Controller()
export class JsonSchemaController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('jsonschema');

  @Get('/jsonschemas/:municipalityId')
  @OpenAPI({ summary: 'Get all JSON schemas' })
  @UseBefore(authMiddleware)
  async getAllSchemas(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('page') page?: number,
    @QueryParam('size') size?: number,
  ): Promise<ApiResponse<JsonSchemaResponseDTO[]>> {
    const url = `${this.SERVICE}/${municipalityId}/schemas`;
    const params = { page: page ?? 0, size: size ?? 100 };

    const res = await this.apiService.get<PageJsonSchema>({ url, params }, req.user);

    const data = res.data.content.map((schema, idx) => ({
      ...schema,
      numericId: idx + 1,
    }));

    return { data, message: 'success' };
  }

  @Get('/jsonschemas/:municipalityId/:id')
  @OpenAPI({ summary: 'Get a JSON schema by ID' })
  @UseBefore(authMiddleware)
  async getSchema(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: string,
  ): Promise<ApiResponse<JsonSchemaResponseDTO>> {
    const url = `${this.SERVICE}/${municipalityId}/schemas/${id}`;
    const res = await this.apiService.get<JsonSchemaEntity>({ url }, req.user);

    return { data: res.data, message: 'success' };
  }

  @Post('/jsonschemas/:municipalityId')
  @OpenAPI({ summary: 'Create a new JSON schema' })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  async createSchema(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Body() body: JsonSchemaRequestDto,
  ): Promise<ApiResponse<JsonSchemaResponseDTO>> {
    const url = `${this.SERVICE}/${municipalityId}/schemas`;

    // The external API returns 201 Created with Location header, no body
    // We need to construct the ID and fetch the created schema
    await this.apiService.post<void>({ url, data: body }, req.user);

    // Construct the schema ID based on the API's pattern: {municipalityId}_{name}_{version}
    const schemaId = `${municipalityId}_${body.name}_${body.version}`;

    // Fetch the created schema
    const getUrl = `${this.SERVICE}/${municipalityId}/schemas/${schemaId}`;
    const res = await this.apiService.get<JsonSchemaEntity>({ url: getUrl }, req.user);

    return { data: res.data, message: 'success' };
  }

  @Delete('/jsonschemas/:municipalityId/:id')
  @OpenAPI({ summary: 'Delete a JSON schema' })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  async deleteSchema(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: string,
  ): Promise<ApiResponse<boolean>> {
    const url = `${this.SERVICE}/${municipalityId}/schemas/${id}`;
    await this.apiService.delete({ url }, req.user);

    return { data: true, message: 'success' };
  }

  // UI Schema endpoints

  @Get('/jsonschemas/:municipalityId/:id/ui-schema')
  @OpenAPI({ summary: 'Get UI schema for a JSON schema' })
  @UseBefore(authMiddleware)
  async getUiSchema(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: string,
  ): Promise<ApiResponse<UiSchemaResponseDTO | null>> {
    const url = `${this.SERVICE}/${municipalityId}/schemas/${id}/ui-schema`;

    try {
      const res = await this.apiService.get<UiSchemaEntity>({ url }, req.user);
      return { data: res.data, message: 'success' };
    } catch (error: any) {
      // UI Schema may not exist (404)
      if (error?.response?.status === 404) {
        return { data: null, message: 'not found' };
      }
      throw error;
    }
  }

  @Put('/jsonschemas/:municipalityId/:id/ui-schema')
  @OpenAPI({ summary: 'Create or update UI schema' })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  async updateUiSchema(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: string,
    @Body() body: UiSchemaRequestDto,
  ): Promise<ApiResponse<UiSchemaResponseDTO | null>> {
    const url = `${this.SERVICE}/${municipalityId}/schemas/${id}/ui-schema`;

    // PUT returns 204 No Content on success
    await this.apiService.put({ url, data: body }, req.user);

    // Fetch the UI schema to return it
    try {
      const res = await this.apiService.get<UiSchemaEntity>({ url }, req.user);
      return { data: res.data, message: 'success' };
    } catch {
      // If we can't fetch it back, just return success with the submitted data
      return {
        data: {
          id: '',
          value: body.value,
          description: body.description,
        },
        message: 'success',
      };
    }
  }

  @Delete('/jsonschemas/:municipalityId/:id/ui-schema')
  @OpenAPI({ summary: 'Delete UI schema' })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  async deleteUiSchema(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: string,
  ): Promise<ApiResponse<boolean>> {
    const url = `${this.SERVICE}/${municipalityId}/schemas/${id}/ui-schema`;
    await this.apiService.delete({ url }, req.user);

    return { data: true, message: 'success' };
  }
}
