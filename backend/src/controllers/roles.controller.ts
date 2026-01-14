import { apiServiceName } from '@/config/api-config';
import { NamespaceConfig, Role as supportmanagementRole } from '@/data-contracts/supportmanagement/data-contracts';
import { RoleRequestDto } from '@/dtos/role.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Role, RoleApiResponse, RoleDeleteApiResponse, RolesApiResponse } from '@/responses/role.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class RolesController {
  private async fetchRole(municipalityId: number, namespace: string, role: string, user: any): Promise<Role> {
    const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/roles/${role}`;

    const res = await this.apiService.get<supportmanagementRole>({ url }, user);

    const data: Role = {
      id: res.data.name,
      name: res.data.name,
      displayName: res.data.displayName,
      createdAt: res.data.created,
      updatedAt: res.data.modified,
    };

    return data;
  }

  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  @Post('/roles/:municipalityId')
  @OpenAPI({ summary: 'Create new role' })
  @UseBefore(authMiddleware)
  @ResponseSchema(RoleApiResponse)
  async createRole(
    @Req() req: RequestWithUser,
    @Body() body: RoleRequestDto,
    @Res() response: Response<RoleApiResponse>,
    @Param('municipalityId') municipalityId: number,
  ): Promise<Response<RoleApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${body.namespace}/metadata/roles`;

      const roleData: supportmanagementRole = {
        name: body.name,
        displayName: body.displayName,
      };

      await this.apiService.post<supportmanagementRole>({ url, data: roleData }, req.user);
      const data = await this.fetchRole(municipalityId, body.namespace, body.name, req.user);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error creating role', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/roles/:municipalityId')
  @OpenAPI({ summary: 'Get all roles' })
  @UseBefore(authMiddleware)
  @ResponseSchema(RolesApiResponse)
  async getRoles(
    @Req() req: RequestWithUser,
    @Res() response: Response<RolesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<RolesApiResponse>> {
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

      const roleResponses = await Promise.all(
        namespacesToSearch.map(ns => {
          const url = `${this.SERVICE}/${municipalityId}/${ns}/metadata/roles`;
          return this.apiService.get<supportmanagementRole[]>({ url }, req.user);
        }),
      );

      const data: Role[] = roleResponses
        .flatMap(res => res.data)
        .map(role => ({
          id: role.name,
          name: role.name,
          displayName: role.displayName,
          createdAt: role.created,
          updatedAt: role.modified,
        }));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting roles', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/roles/:municipalityId/:namespace/:role')
  @ResponseSchema(RoleDeleteApiResponse)
  async deleteRole(
    @Req() req: RequestWithUser,
    @Res() response: Response<ApiResponse<boolean>>,
    @Param('municipalityId') municipalityId: number,
    @Param('role') role: string,
    @Param('namespace') namespace: string,
  ): Promise<Response<ApiResponse<boolean>>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/roles/${role}`;
      await this.apiService.delete<{}>({ url }, req.user);
      return response.send({ data: true, message: 'Role deleted successfully' });
    } catch (error) {
      logger.error('Error deleting role', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
