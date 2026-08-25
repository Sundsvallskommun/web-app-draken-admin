import { apiServiceName } from '@/config/api-config';
import { NamespaceConfig, Status as supportmanagementStatus } from '@/data-contracts/supportmanagement/data-contracts';
import { StatusRequestDto, StatusUpdateDto } from '@/dtos/status.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Status, StatusApiResponse, StatusDeleteApiResponse, StatusesApiResponse } from '@/responses/status.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Patch, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class StatusesController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private mapStatus(status: supportmanagementStatus, namespace: string): Status {
    return {
      id: status.id,
      name: status.name,
      displayName: status.displayName,
      externalDisplayName: status.externalDisplayName,
      namespace,
      createdAt: status.created,
      updatedAt: status.modified,
    };
  }

  @Post('/statuses/:municipalityId')
  @OpenAPI({ summary: 'Create new status' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatusApiResponse)
  async createStatus(
    @Req() req: RequestWithUser,
    @Body() body: StatusRequestDto,
    @Res() response: Response<StatusApiResponse>,
    @Param('municipalityId') municipalityId: number,
  ): Promise<Response<StatusApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${body.namespace}/metadata/statuses`;

      const statusData: supportmanagementStatus = {
        name: body.name,
        displayName: body.displayName,
        externalDisplayName: body.externalDisplayName,
      };

      const postRes = await this.apiService.post<supportmanagementStatus>({ url, data: statusData }, req.user);

      if (postRes.data?.id) {
        const fetchUrl = `${this.SERVICE}/${municipalityId}/${body.namespace}/metadata/statuses/${postRes.data.id}`;
        const res = await this.apiService.get<supportmanagementStatus>({ url: fetchUrl }, req.user);
        const data = this.mapStatus(res.data, body.namespace);
        return response.send({ data, message: 'success' });
      }

      // Fallback: list statuses and find by name
      const listRes = await this.apiService.get<supportmanagementStatus[]>({ url }, req.user);
      const created = listRes.data.find(s => s.name === body.name);
      const data = this.mapStatus(created, body.namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error creating status', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/statuses/:municipalityId')
  @OpenAPI({ summary: 'Get all statuses' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatusesApiResponse)
  async getStatuses(
    @Req() req: RequestWithUser,
    @Res() response: Response<StatusesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<StatusesApiResponse>> {
    try {
      let namespacesToSearch: string[] = [];

      if (namespace) {
        namespacesToSearch = [namespace];
      } else {
        const namespacesUrl = `${this.SERVICE}/namespace-configs?municipalityId=${municipalityId}`;
        const namespacesRes = await this.apiService.get<NamespaceConfig[]>({ url: namespacesUrl }, req.user);

        const supportmanagementNamespaces = namespacesRes.data.map(n => n.namespace);

        namespacesToSearch = supportmanagementNamespaces;
      }

      const statusesResponses = await Promise.all(
        namespacesToSearch.map(ns => {
          const url = `${this.SERVICE}/${municipalityId}/${ns}/metadata/statuses`;
          return this.apiService.get<supportmanagementStatus[]>({ url }, req.user).then(res => ({
            namespace: ns,
            statuses: res.data,
          }));
        }),
      );

      const data: Status[] = statusesResponses.flatMap(({ namespace: ns, statuses }) => statuses.map(status => this.mapStatus(status, ns)));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting statuses', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/statuses/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Get a status by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatusApiResponse)
  async getStatus(
    @Req() req: RequestWithUser,
    @Res() response: Response<StatusApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<StatusApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/statuses/${id}`;
      const res = await this.apiService.get<supportmanagementStatus>({ url }, req.user);
      const data = this.mapStatus(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting status', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Patch('/statuses/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Update a status by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatusApiResponse)
  async updateStatus(
    @Req() req: RequestWithUser,
    @Body() body: StatusUpdateDto,
    @Res() response: Response<StatusApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<StatusApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/statuses/${id}`;

      // Fetch current status to get required name field
      const current = await this.apiService.get<supportmanagementStatus>({ url }, req.user);

      const patchData: Partial<supportmanagementStatus> = {
        name: current.data.name,
      };
      if (body.displayName !== undefined) {
        patchData.displayName = body.displayName;
      }
      if (body.externalDisplayName !== undefined) {
        patchData.externalDisplayName = body.externalDisplayName;
      }

      await this.apiService.patch<supportmanagementStatus>({ url, data: patchData }, req.user);

      const res = await this.apiService.get<supportmanagementStatus>({ url }, req.user);
      const data = this.mapStatus(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating status', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/statuses/:municipalityId/:namespace/:id')
  @ResponseSchema(StatusDeleteApiResponse)
  async deleteStatus(
    @Req() req: RequestWithUser,
    @Res() response: Response<ApiResponse<boolean>>,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: string,
    @Param('namespace') namespace: string,
  ): Promise<Response<ApiResponse<boolean>>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/statuses/${id}`;
      await this.apiService.delete<{}>({ url }, req.user);
      return response.send({ data: true, message: 'Status deleted successfully' });
    } catch (error) {
      logger.error('Error deleting status', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
