import { FeatureFlagRequestDto, UpdateFeatureFlagDto } from '@/dtos/featureflag.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { FeatureFlagApiResponse, FeatureFlagDeleteApiResponse, FeatureFlagsApiResponse } from '@/responses/featureflag.response';
import { logger } from '@/utils/logger';
import prisma from '@/utils/prisma';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Post, Put, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class FeatureFlagController {
  @Post('/featureflags/:municipalityId')
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @OpenAPI({ summary: 'Create a new feature flag' })
  @ResponseSchema(FeatureFlagApiResponse)
  async createFeatureFlag(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Body() body: FeatureFlagRequestDto,
    @Res() response: Response<FeatureFlagApiResponse>,
  ): Promise<Response<FeatureFlagApiResponse>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const data = await prisma.featureFlags.create({
        data: { ...body, municipalityId: municipalityId },
      });

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error creating featureflag', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/featureflags/:municipalityId')
  @OpenAPI({ summary: 'Get all feature flags' })
  @ResponseSchema(FeatureFlagsApiResponse)
  async getFeatureFlags(
    @Res() response: Response<FeatureFlagsApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<FeatureFlagsApiResponse>> {
    try {
      const where: Prisma.FeatureFlagsWhereInput = {
        municipalityId,
      };

      if (namespace?.trim()) {
        where.namespace = namespace;
      }

      const data = await prisma.featureFlags.findMany({
        where,
      });

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting featureflags', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/featureflags/:municipalityId/:id')
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @OpenAPI({ summary: 'Get a feature flag using id' })
  @ResponseSchema(FeatureFlagApiResponse)
  async getFeatureFlag(
    @Req() req: RequestWithUser,
    @Param('id') id: number,
    @Param('municipalityId') municipalityId: number,
    @Res() response: Response<FeatureFlagApiResponse>,
  ): Promise<Response<FeatureFlagApiResponse>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      const data = await prisma.featureFlags.findFirst({
        where: { id, municipalityId },
      });

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting featureflag', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Put('/featureflags/:municipalityId/:id')
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @OpenAPI({ summary: 'Update a new feature flag' })
  @ResponseSchema(FeatureFlagApiResponse)
  async updateFeatureFlag(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: number,
    @Body() body: UpdateFeatureFlagDto,
    @Res() response: Response<FeatureFlagApiResponse>,
  ): Promise<Response<FeatureFlagApiResponse>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    if (id !== body.id) {
      throw new HttpException(400, 'Missmatching ids');
    }

    try {
      const data = await prisma.featureFlags.update({
        where: { id, municipalityId },
        data: body,
      });

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating featureflag', error);

      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/featureflags/:municipalityId/:id')
  @ResponseSchema(FeatureFlagDeleteApiResponse)
  async deleteFeatureFlag(
    @Req() req: RequestWithUser,
    @Param('municipalityId') municipalityId: number,
    @Param('id') id: number,
    @Res() response: Response<ApiResponse<boolean>>,
  ): Promise<Response<ApiResponse<boolean>>> {
    if (!req.user) {
      throw new HttpException(400, 'Bad Request');
    }

    try {
      await prisma.featureFlags.delete({
        where: { id, municipalityId },
      });

      return response.send({ data: true, message: 'success' });
    } catch (error) {
      logger.error('Error deleting featureflag', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
