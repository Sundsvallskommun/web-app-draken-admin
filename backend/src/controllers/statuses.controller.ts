import { apiServiceName } from '@/config/api-config';
import { NamespaceConfig, Status as supportmanagementStatus } from '@/data-contracts/supportmanagement/data-contracts';
import { StatusRequestDto } from '@/dtos/status.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Status, StatusApiResponse, StatusDeleteApiResponse, StatusesApiResponse } from '@/responses/status.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class StatusesController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

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
      };

      await this.apiService.post<supportmanagementStatus>({ url, data: statusData }, req.user);

      const statusUrl = `${this.SERVICE}/${municipalityId}/${body.namespace}/metadata/statuses/${body.name}`;

      const res = await this.apiService.get<supportmanagementStatus>({ url: statusUrl }, req.user);

      const data: Status = {
        id: res.data.name,
        name: res.data.name,
        createdAt: res.data.created,
        updatedAt: res.data.modified,
      };

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
          return this.apiService.get<supportmanagementStatus[]>({ url }, req.user);
        }),
      );

      const data: Status[] = statusesResponses
        .flatMap(res => res.data)
        .map(status => ({
          id: status.name,
          name: status.name,
          createdAt: status.created,
          updatedAt: status.modified,
        }));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting statuses', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/statuses/:municipalityId/:namespace/:status')
  @ResponseSchema(StatusDeleteApiResponse)
  async deleteStatus(
    @Req() req: RequestWithUser,
    @Res() response: Response<ApiResponse<boolean>>,
    @Param('municipalityId') municipalityId: number,
    @Param('status') status: string,
    @Param('namespace') namespace: string,
  ): Promise<Response<ApiResponse<boolean>>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/statuses/${status}`;
      await this.apiService.delete<{}>({ url }, req.user);
      return response.send({ data: true, message: 'Status deleted successfully' });
    } catch (error) {
      logger.error('Error deleting status', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
