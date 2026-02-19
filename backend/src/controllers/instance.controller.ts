import { InstanceRequestDto, UpdateInstanceDto } from '@/dtos/instance.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { InstanceApiResponse, InstanceDeleteApiResponse, InstancesApiResponse } from '@/responses/instance.response';
import { logger } from '@/utils/logger';
import prisma from '@/utils/prisma';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class InstanceController {
  @Post('/instances/:municipalityId')
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @OpenAPI({ summary: 'Create a new instance' })
  @ResponseSchema(InstanceApiResponse)
  async createInstance(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Body() body: InstanceRequestDto,
    @Res() response: Response<InstanceApiResponse>,
  ): Promise<Response<InstanceApiResponse>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const data = await prisma.instance.create({
        data: { ...body, municipalityId: municipalityId },
      });

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error creating instance', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/instances/:municipalityId/me')
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: 'Get instances accessible by current user' })
  async getMyInstances(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Res() response: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const userGroups = req.user.groups.map(g => g.toLowerCase());
      const allInstances = await prisma.instance.findMany({
        where: { enabled: true, municipalityId },
        orderBy: { name: 'asc' },
      });

      const accessible = allInstances.filter(instance =>
        instance.authorizedGroups.split(',')
          .some(ag => userGroups.includes(ag.trim().toLowerCase()))
      );

      const data = accessible.map(({ id, name, url }) => ({ id, name, url }));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting user instances', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/instances/:municipalityId')
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @OpenAPI({ summary: 'Get all instances' })
  @ResponseSchema(InstancesApiResponse)
  async getInstances(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Res() response: Response<InstancesApiResponse>,
  ): Promise<Response<InstancesApiResponse>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const data = await prisma.instance.findMany({
        where: { municipalityId },
      });

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting instances', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/instances/:municipalityId/:id')
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @OpenAPI({ summary: 'Get an instance using id' })
  @ResponseSchema(InstanceApiResponse)
  async getInstance(
    @Req() req: RequestWithUser,
    @Param('id') id: number,
    @Param('municipalityId') municipalityId: number,
    @Res() response: Response<InstanceApiResponse>,
  ): Promise<Response<InstanceApiResponse>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const data = await prisma.instance.findFirst({
        where: { id, municipalityId },
      });

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting instance', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Put('/instances/:municipalityId/:id')
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @OpenAPI({ summary: 'Update an instance' })
  @ResponseSchema(InstanceApiResponse)
  async updateInstance(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: number,
    @Body() body: UpdateInstanceDto,
    @Res() response: Response<InstanceApiResponse>,
  ): Promise<Response<InstanceApiResponse>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    if (id !== body.id) {
      throw new HttpException(400, 'Missmatching ids');
    }

    try {
      const data = await prisma.instance.update({
        where: { id, municipalityId },
        data: body,
      });

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating instance', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/instances/:municipalityId/:id')
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @OpenAPI({ summary: 'Delete an instance' })
  @ResponseSchema(InstanceDeleteApiResponse)
  async deleteInstance(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: number,
    @Res() response: Response<ApiResponse<boolean>>,
  ): Promise<Response<ApiResponse<boolean>>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      await prisma.instance.delete({
        where: { id, municipalityId },
      });

      return response.send({ data: true, message: 'success' });
    } catch (error) {
      logger.error('Error deleting instance', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
