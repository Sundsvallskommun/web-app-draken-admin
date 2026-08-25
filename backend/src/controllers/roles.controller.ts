import { apiServiceName } from '@/config/api-config';
import { NamespaceConfig, Role as supportmanagementRole } from '@/data-contracts/supportmanagement/data-contracts';
import { RoleRequestDto, RoleUpdateDto } from '@/dtos/role.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Role, RoleApiResponse, RoleDeleteApiResponse, RolesApiResponse } from '@/responses/role.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Patch, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class RolesController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private mapRole(role: supportmanagementRole, namespace: string): Role {
    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      namespace,
      createdAt: role.created,
      updatedAt: role.modified,
    };
  }

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

      const postRes = await this.apiService.post<supportmanagementRole>({ url, data: roleData }, req.user);

      if (postRes.data?.id) {
        const fetchUrl = `${this.SERVICE}/${municipalityId}/${body.namespace}/metadata/roles/${postRes.data.id}`;
        const res = await this.apiService.get<supportmanagementRole>({ url: fetchUrl }, req.user);
        const data = this.mapRole(res.data, body.namespace);
        return response.send({ data, message: 'success' });
      }

      // Fallback: list roles and find by name
      const listRes = await this.apiService.get<supportmanagementRole[]>({ url }, req.user);
      const created = listRes.data.find(r => r.name === body.name);
      const data = this.mapRole(created, body.namespace);

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
          return this.apiService.get<supportmanagementRole[]>({ url }, req.user).then(res => ({
            namespace: ns,
            roles: res.data,
          }));
        }),
      );

      const data: Role[] = roleResponses.flatMap(({ namespace: ns, roles }) => roles.map(role => this.mapRole(role, ns)));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting roles', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/roles/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Get a role by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(RoleApiResponse)
  async getRole(
    @Req() req: RequestWithUser,
    @Res() response: Response<RoleApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<RoleApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/roles/${id}`;
      const res = await this.apiService.get<supportmanagementRole>({ url }, req.user);
      const data = this.mapRole(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting role', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Patch('/roles/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Update a role by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(RoleApiResponse)
  async updateRole(
    @Req() req: RequestWithUser,
    @Body() body: RoleUpdateDto,
    @Res() response: Response<RoleApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<RoleApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/roles/${id}`;

      // Fetch current role to get required name field
      const current = await this.apiService.get<supportmanagementRole>({ url }, req.user);

      const patchData: Partial<supportmanagementRole> = {
        name: current.data.name,
      };
      if (body.displayName !== undefined) {
        patchData.displayName = body.displayName;
      }

      await this.apiService.patch<supportmanagementRole>({ url, data: patchData }, req.user);

      const res = await this.apiService.get<supportmanagementRole>({ url }, req.user);
      const data = this.mapRole(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating role', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/roles/:municipalityId/:namespace/:id')
  @ResponseSchema(RoleDeleteApiResponse)
  async deleteRole(
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
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/roles/${id}`;
      await this.apiService.delete<{}>({ url }, req.user);
      return response.send({ data: true, message: 'Role deleted successfully' });
    } catch (error) {
      logger.error('Error deleting role', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
