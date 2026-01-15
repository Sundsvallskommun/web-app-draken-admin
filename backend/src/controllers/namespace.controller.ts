import { apiServiceName } from '@/config/api-config';
import { NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { NamespaceRequestDto } from '@/dtos/namespace.dto';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Namespace, NamespaceApiResponse, NamespacesApiResponse } from '@/responses/namespace.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import { Response } from 'express';
import { Body, Controller, Get, Param, Post, Put, Req, Res } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class NamespaceController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  @Post('/namespaces/:municipalityId')
  @OpenAPI({ summary: 'Create a namespace' })
  @ResponseSchema(NamespaceApiResponse)
  async createNamespace(
    @Res() response: Response<NamespaceApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Body() body: NamespaceRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<Response<NamespaceApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${body.namespace}/namespace-config`;

      const formattedBody: NamespaceRequestDto = {
        displayName: body.displayName,
        shortCode: body.shortCode,
        notificationTTLInDays: body.notificationTTLInDays,
        accessControl: body.accessControl,
        notifyReporter: body.notifyReporter,
      };
      await this.apiService.post<NamespaceConfig>({ url, data: formattedBody }, req.user);

      const res = await this.apiService.get<NamespaceConfig>({ url }, req.user);

      const data: Namespace = {
        namespace: res.data.namespace,
        displayName: res.data.displayName,
        shortCode: res.data.shortCode,
        notificationTTLInDays: res.data.notificationTTLInDays,
        accessControl: res.data.accessControl,
        notifyReporter: res.data.notifyReporter,
        createdAt: res.data.created,
        updatedAt: res.data.modified,
      };

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error creating namespace', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Put('/namespaces/:municipalityId/:namespace')
  @OpenAPI({ summary: 'Update a namespace' })
  @ResponseSchema(NamespaceApiResponse)
  async updateNamespace(
    @Res() response: Response<NamespaceApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Body() body: NamespaceRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<Response<NamespaceApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/namespace-config`;

      const formattedBody: NamespaceRequestDto = {
        displayName: body.displayName,
        shortCode: body.shortCode,
        notificationTTLInDays: body.notificationTTLInDays,
        accessControl: body.accessControl,
        notifyReporter: body.notifyReporter,
      };
      await this.apiService.put<NamespaceConfig>({ url, data: formattedBody }, req.user);

      const res = await this.apiService.get<NamespaceConfig>({ url }, req.user);

      const data: Namespace = {
        namespace: res.data.namespace,
        displayName: res.data.displayName,
        shortCode: res.data.shortCode,
        notificationTTLInDays: res.data.notificationTTLInDays,
        accessControl: res.data.accessControl,
        notifyReporter: res.data.notifyReporter,
        createdAt: res.data.created,
        updatedAt: res.data.modified,
      };

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating namespace', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/namespaces/:municipalityId')
  @OpenAPI({ summary: 'Get all namespaces' })
  @ResponseSchema(NamespacesApiResponse)
  async getSupportManagementNamespaces(
    @Res() response: Response<NamespacesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Req() req: RequestWithUser,
  ): Promise<Response<NamespacesApiResponse>> {
    try {
      const url = `${this.SERVICE}/namespace-configs?municipalityId=${municipalityId}`;
      const res = await this.apiService.get<NamespaceConfig[]>({ url }, req.user);

      const supportmanagementNameSpaces: Namespace[] = res.data.map(namespace => ({
        namespace: namespace.namespace,
        displayName: namespace.displayName,
        shortCode: namespace.shortCode,
        createdAt: namespace.created,
        updatedAt: namespace.modified,
      }));

      const data = supportmanagementNameSpaces.sort((a, b) => a.displayName.localeCompare(b.displayName));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting namespaces', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/namespaces/:municipalityId/all')
  @OpenAPI({ summary: 'Get all namespaces, including casedata' })
  @ResponseSchema(NamespacesApiResponse)
  async getNamespaces(
    @Res() response: Response<NamespacesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Req() req: RequestWithUser,
  ): Promise<Response<NamespacesApiResponse>> {
    try {
      const url = `${this.SERVICE}/namespace-configs?municipalityId=${municipalityId}`;
      const res = await this.apiService.get<NamespaceConfig[]>({ url }, req.user);

      const supportmanagementNameSpaces: Namespace[] = res.data.map(namespace => ({
        namespace: namespace.namespace,
        displayName: namespace.displayName,
      }));

      // Add casedata namespaces
      const MUNICIPALITY_NAMESPACES: Record<number, Namespace[]> = {
        2281: [
          { namespace: 'SBK_MEX', displayName: 'Mark och exploatering' },
          { namespace: 'SBK_PARKING_PERMIT', displayName: 'Parkeringstillstånd' },
        ],
        2260: [{ namespace: 'ANGE_PARKING_PERMIT', displayName: 'Parkeringstillstånd Ånge' }],
      };

      const casedataNamespaces = MUNICIPALITY_NAMESPACES[municipalityId] ?? [];

      const data = supportmanagementNameSpaces.concat(casedataNamespaces).sort((a, b) => a.displayName.localeCompare(b.displayName));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting namespaces', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/namespaces/:municipalityId/:namespace')
  @OpenAPI({ summary: 'Get a namespace using a namespace name' })
  @ResponseSchema(NamespaceApiResponse)
  async getNamespace(
    @Res() response: Response<NamespaceApiResponse>,
    @Param('namespace') namespace: string,
    @Param('municipalityId') municipalityId: number,
    @Req() req: RequestWithUser,
  ): Promise<Response<NamespaceApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/namespace-config`;
      const res = await this.apiService.get<NamespaceConfig>({ url }, req.user);

      const data: Namespace = {
        namespace: res.data.namespace,
        displayName: res.data.displayName,
        shortCode: res.data.shortCode,
        notificationTTLInDays: res.data.notificationTTLInDays,
        accessControl: res.data.accessControl,
        notifyReporter: res.data.notifyReporter,
        createdAt: res.data.created,
        updatedAt: res.data.modified,
      };

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting namespaces', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
