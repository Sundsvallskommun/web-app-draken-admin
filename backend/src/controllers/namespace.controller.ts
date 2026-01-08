import { MUNICIPALITY_ID } from '@/config';
import { apiServiceName } from '@/config/api-config';
import { NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Namespace, NamespaceApiResponse, NamespacesApiResponse } from '@/responses/namespace.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import { Response } from 'express';
import { Controller, Get, Param, Req, Res } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class NamespaceController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  @Get('/namespaces/:name')
  @OpenAPI({ summary: 'Get a namespace using a namespace name' })
  @ResponseSchema(NamespaceApiResponse)
  async getNamespace(
    @Res() response: Response<NamespaceApiResponse>,
    @Param('name') name: string,
    @Req() req: RequestWithUser,
  ): Promise<Response<NamespaceApiResponse>> {
    try {
      const url = `${this.SERVICE}/${MUNICIPALITY_ID}/${name}/namespace-configs`;
      const res = await this.apiService.get<NamespaceConfig>({ url }, req.user);

      const data: Namespace = {
        namespace: res.data.namespace,
        displayName: res.data.displayName,
        createdAt: res.data.created,
        updatedAt: res.data.modified,
      };

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting namespaces', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/namespaces')
  @OpenAPI({ summary: 'Get all namespaces' })
  @ResponseSchema(NamespacesApiResponse)
  async getNamespaces(@Res() response: Response<NamespacesApiResponse>, @Req() req: RequestWithUser): Promise<Response<NamespacesApiResponse>> {
    try {
      const url = `${this.SERVICE}/namespace-configs?municipalityId=${MUNICIPALITY_ID}`;
      const res = await this.apiService.get<NamespaceConfig[]>({ url }, req.user);

      const supportmanagementNameSpaces: Namespace[] = res.data.map(namespace => ({
        namespace: namespace.namespace,
        displayName: namespace.displayName,
      }));

      // Add casedata namespaces
      const data = MUNICIPALITY_ID === '2281' && supportmanagementNameSpaces
        .concat([
          { namespace: 'SBK_MEX', displayName: 'Mark och exploatering' },
          { namespace: 'SBK_PARKING_PERMIT', displayName: 'Parkeringstillstånd' },
        ])
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting namespaces', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
