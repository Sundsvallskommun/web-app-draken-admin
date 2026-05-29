import { apiServiceName } from '@/config/api-config';
import { Category as supportmanagementCategory, NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { CategoryRequestDto, CategoryUpdateDto } from '@/dtos/category.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { CategoriesApiResponse, Category, CategoryApiResponse, CategoryDeleteApiResponse } from '@/responses/category.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Patch, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class CategoriesController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private mapCategory(category: supportmanagementCategory, namespace: string): Category {
    return {
      id: category.id,
      name: category.name,
      displayName: category.displayName,
      sortOrder: category.sortOrder,
      types: (category.types ?? []).map(type => ({
        name: type.name,
        displayName: type.displayName,
        escalationEmail: type.escalationEmail,
        createdAt: type.created,
        updatedAt: type.modified,
      })),
      namespace,
      createdAt: category.created,
      updatedAt: category.modified,
    };
  }

  @Post('/categories/:municipalityId')
  @OpenAPI({ summary: 'Create new category' })
  @UseBefore(authMiddleware)
  @ResponseSchema(CategoryApiResponse)
  async createCategory(
    @Req() req: RequestWithUser,
    @Body() body: CategoryRequestDto,
    @Res() response: Response<CategoryApiResponse>,
    @Param('municipalityId') municipalityId: number,
  ): Promise<Response<CategoryApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${body.namespace}/metadata/categories`;

      const categoryData: supportmanagementCategory = {
        name: body.name,
        displayName: body.displayName,
        sortOrder: body.sortOrder,
        types: body.types ?? [],
      };

      await this.apiService.post<supportmanagementCategory>({ url, data: categoryData }, req.user);

      // Single-category endpoints are addressed by UUID, which the POST does not return.
      // Fetch the list and find the created category by its (unique) name to obtain the id.
      const listRes = await this.apiService.get<supportmanagementCategory[]>({ url }, req.user);
      const created = listRes.data.find(c => c.name === body.name);
      const data = this.mapCategory(created, body.namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error creating category', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/categories/:municipalityId')
  @OpenAPI({ summary: 'Get all categories' })
  @UseBefore(authMiddleware)
  @ResponseSchema(CategoriesApiResponse)
  async getCategories(
    @Req() req: RequestWithUser,
    @Res() response: Response<CategoriesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<CategoriesApiResponse>> {
    try {
      let namespacesToSearch: string[] = [];

      if (namespace) {
        namespacesToSearch = [namespace];
      } else {
        const namespacesUrl = `${this.SERVICE}/namespace-configs?municipalityId=${municipalityId}`;
        const namespacesRes = await this.apiService.get<NamespaceConfig[]>({ url: namespacesUrl }, req.user);
        namespacesToSearch = namespacesRes.data.map(n => n.namespace);
      }

      const categoryResponses = await Promise.all(
        namespacesToSearch.map(ns => {
          const url = `${this.SERVICE}/${municipalityId}/${ns}/metadata/categories`;
          return this.apiService.get<supportmanagementCategory[]>({ url }, req.user).then(res => ({
            namespace: ns,
            categories: res.data,
          }));
        }),
      );

      const data: Category[] = categoryResponses.flatMap(({ namespace: ns, categories }) =>
        categories.map(category => this.mapCategory(category, ns)),
      );

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting categories', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/categories/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Get a category by name' })
  @UseBefore(authMiddleware)
  @ResponseSchema(CategoryApiResponse)
  async getCategory(
    @Req() req: RequestWithUser,
    @Res() response: Response<CategoryApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<CategoryApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/categories/${id}`;
      const res = await this.apiService.get<supportmanagementCategory>({ url }, req.user);
      const data = this.mapCategory(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting category', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Patch('/categories/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Update a category by name' })
  @UseBefore(authMiddleware)
  @ResponseSchema(CategoryApiResponse)
  async updateCategory(
    @Req() req: RequestWithUser,
    @Body() body: CategoryUpdateDto,
    @Res() response: Response<CategoryApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<CategoryApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/categories/${id}`;

      // Fetch current to preserve the immutable name field
      const current = await this.apiService.get<supportmanagementCategory>({ url }, req.user);

      const patchData: Partial<supportmanagementCategory> = {
        name: current.data.name,
      };
      if (body.displayName !== undefined) {
        patchData.displayName = body.displayName;
      }
      if (body.sortOrder !== undefined) {
        patchData.sortOrder = body.sortOrder;
      }
      if (body.types !== undefined) {
        patchData.types = body.types;
      }

      await this.apiService.patch<supportmanagementCategory>({ url, data: patchData }, req.user);

      const res = await this.apiService.get<supportmanagementCategory>({ url }, req.user);
      const data = this.mapCategory(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating category', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/categories/:municipalityId/:namespace/:id')
  @ResponseSchema(CategoryDeleteApiResponse)
  async deleteCategory(
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
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/categories/${id}`;
      await this.apiService.delete<{}>({ url }, req.user);
      return response.send({ data: true, message: 'Category deleted successfully' });
    } catch (error) {
      logger.error('Error deleting category', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
