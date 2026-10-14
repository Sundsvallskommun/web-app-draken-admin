import { apiServiceName } from '@/config/api-config';
import { MeasureType as supportmanagementMeasureType, NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { MeasureTypeRequestDto, MeasureTypeUpdateDto } from '@/dtos/measure-type.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { MeasureType, MeasureTypeApiResponse, MeasureTypeDeleteApiResponse, MeasureTypesApiResponse } from '@/responses/measure-type.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Patch, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

/**
 * Measure types are namespace metadata in Support Management
 * (`/{municipalityId}/{namespace}/metadata/measuretypes`). Each belongs to one or
 * more measure groups; the gateway requires at least one group on create and
 * rejects an update that empties them.
 */
export const mapMeasureType = (measureType: supportmanagementMeasureType, namespace: string): MeasureType => ({
  id: measureType.id,
  name: measureType.name,
  displayName: measureType.displayName ?? undefined,
  measureGroups: measureType.measureGroups ?? [],
  sortOrder: measureType.sortOrder ?? undefined,
  deprecated: measureType.deprecated ?? false,
  namespace,
  createdAt: measureType.created,
  updatedAt: measureType.modified,
});

@Controller()
export class MeasureTypesController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private measureTypesUrl(municipalityId: number, namespace: string, id?: string): string {
    const base = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/measuretypes`;
    return id ? `${base}/${id}` : base;
  }

  @Post('/measure-types/:municipalityId')
  @OpenAPI({ summary: 'Create new measure type' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MeasureTypeApiResponse)
  async createMeasureType(
    @Req() req: RequestWithUser,
    @Body() body: MeasureTypeRequestDto,
    @Res() response: Response<MeasureTypeApiResponse>,
    @Param('municipalityId') municipalityId: number,
  ): Promise<Response<MeasureTypeApiResponse>> {
    try {
      const url = this.measureTypesUrl(municipalityId, body.namespace);

      const measureTypeData: supportmanagementMeasureType = {
        name: body.name,
        displayName: body.displayName,
        measureGroups: body.measureGroups,
        sortOrder: body.sortOrder,
        deprecated: body.deprecated ?? false,
      };

      const postRes = await this.apiService.post<supportmanagementMeasureType>({ url, data: measureTypeData }, req.user);

      if (postRes.data?.id) {
        const res = await this.apiService.get<supportmanagementMeasureType>(
          { url: this.measureTypesUrl(municipalityId, body.namespace, postRes.data.id) },
          req.user,
        );
        return response.send({ data: mapMeasureType(res.data, body.namespace), message: 'success' });
      }

      // The gateway answers 201 with a Location header and no body: list and find by name
      const listRes = await this.apiService.get<supportmanagementMeasureType[]>({ url }, req.user);
      const created = listRes.data.find(measureType => measureType.name === body.name);
      if (!created) {
        throw new HttpException(500, 'Measure type was created but could not be read back');
      }

      return response.send({ data: mapMeasureType(created, body.namespace), message: 'success' });
    } catch (error) {
      logger.error('Error creating measure type', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/measure-types/:municipalityId')
  @OpenAPI({ summary: 'Get all measure types' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MeasureTypesApiResponse)
  async getMeasureTypes(
    @Req() req: RequestWithUser,
    @Res() response: Response<MeasureTypesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<MeasureTypesApiResponse>> {
    try {
      let namespacesToSearch: string[] = [];

      if (namespace) {
        namespacesToSearch = [namespace];
      } else {
        const namespacesUrl = `${this.SERVICE}/namespace-configs?municipalityId=${municipalityId}`;
        const namespacesRes = await this.apiService.get<NamespaceConfig[]>({ url: namespacesUrl }, req.user);
        namespacesToSearch = namespacesRes.data.map(n => n.namespace);
      }

      const measureTypeResponses = await Promise.all(
        namespacesToSearch.map(ns =>
          this.apiService
            .get<supportmanagementMeasureType[]>({ url: this.measureTypesUrl(municipalityId, ns) }, req.user)
            .then(res => ({ namespace: ns, measureTypes: res.data })),
        ),
      );

      const data: MeasureType[] = measureTypeResponses.flatMap(({ namespace: ns, measureTypes }) =>
        measureTypes.map(measureType => mapMeasureType(measureType, ns)),
      );

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting measure types', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/measure-types/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Get a measure type by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MeasureTypeApiResponse)
  async getMeasureType(
    @Req() req: RequestWithUser,
    @Res() response: Response<MeasureTypeApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<MeasureTypeApiResponse>> {
    try {
      const res = await this.apiService.get<supportmanagementMeasureType>({ url: this.measureTypesUrl(municipalityId, namespace, id) }, req.user);
      return response.send({ data: mapMeasureType(res.data, namespace), message: 'success' });
    } catch (error) {
      logger.error('Error getting measure type', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Patch('/measure-types/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Update a measure type by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MeasureTypeApiResponse)
  async updateMeasureType(
    @Req() req: RequestWithUser,
    @Body() body: MeasureTypeUpdateDto,
    @Res() response: Response<MeasureTypeApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<MeasureTypeApiResponse>> {
    try {
      const url = this.measureTypesUrl(municipalityId, namespace, id);

      // Fetch current to preserve the immutable name key (required by the gateway)
      const current = await this.apiService.get<supportmanagementMeasureType>({ url }, req.user);

      const patchData: supportmanagementMeasureType = {
        name: current.data.name,
      };
      if (body.displayName !== undefined) {
        patchData.displayName = body.displayName;
      }
      if (body.measureGroups !== undefined) {
        patchData.measureGroups = body.measureGroups;
      }
      if (body.sortOrder !== undefined) {
        patchData.sortOrder = body.sortOrder;
      }
      if (body.deprecated !== undefined) {
        patchData.deprecated = body.deprecated;
      }

      await this.apiService.patch<supportmanagementMeasureType>({ url, data: patchData }, req.user);

      const res = await this.apiService.get<supportmanagementMeasureType>({ url }, req.user);
      return response.send({ data: mapMeasureType(res.data, namespace), message: 'success' });
    } catch (error) {
      logger.error('Error updating measure type', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/measure-types/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Delete a measure type by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MeasureTypeDeleteApiResponse)
  async deleteMeasureType(
    @Req() req: RequestWithUser,
    @Res() response: Response<ApiResponse<boolean>>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<ApiResponse<boolean>>> {
    try {
      await this.apiService.delete<{}>({ url: this.measureTypesUrl(municipalityId, namespace, id) }, req.user);
      return response.send({ data: true, message: 'Measure type deleted successfully' });
    } catch (error) {
      logger.error('Error deleting measure type', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
