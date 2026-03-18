import { apiServiceName } from '@/config/api-config';
import { Label as SupportManagementLabel, Labels } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Label, LabelsApiResponse } from '@/responses/label.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Get, Param, Post, Put, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

function mapLabel(label: SupportManagementLabel): Label {
  return {
    id: label.id,
    classification: label.classification,
    displayName: label.displayName,
    resourceName: label.resourceName,
    resourcePath: label.resourcePath,
    isLeaf: !label.labels || label.labels.length === 0,
    labels: label.labels?.map(mapLabel) ?? [],
  };
}

function sortLabels(labels: Label[]): Label[] {
  return labels
    .map((label) => ({
      ...label,
      labels: label.labels ? sortLabels(label.labels) : [],
    }))
    .sort((a, b) => {
      const aIsLeaf = !a.labels || a.labels.length === 0;
      const bIsLeaf = !b.labels || b.labels.length === 0;
      if (aIsLeaf !== bIsLeaf) return aIsLeaf ? -1 : 1;
      return (a.displayName ?? a.classification).localeCompare(b.displayName ?? b.classification);
    });
}

@Controller()
export class LabelsController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  @Get('/labels/:municipalityId/:namespace')
  @OpenAPI({ summary: 'Get labels for a namespace' })
  @UseBefore(authMiddleware)
  @ResponseSchema(LabelsApiResponse)
  async getLabels(
    @Req() req: RequestWithUser,
    @Res() response: Response<LabelsApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
  ): Promise<Response<LabelsApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/labels`;
      const res = await this.apiService.get<Labels>({ url }, req.user);

      const data = sortLabels((res.data.labelStructure ?? []).map(mapLabel));

      return response.send({ data, message: 'success' });
    } catch (error) {
      if (error?.status === 404) {
        return response.send({ data: [], message: 'success' });
      }
      logger.error('Error getting labels', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Post('/labels/:municipalityId/:namespace')
  @OpenAPI({ summary: 'Create labels for a namespace' })
  @UseBefore(authMiddleware)
  @ResponseSchema(LabelsApiResponse)
  async createLabels(
    @Req() req: RequestWithUser,
    @Res() response: Response<LabelsApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Body() body: { labelStructure: SupportManagementLabel[] },
  ): Promise<Response<LabelsApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/labels`;
      await this.apiService.post<void>({ url, data: body.labelStructure }, req.user);

      const res = await this.apiService.get<Labels>({ url }, req.user);
      const data = sortLabels((res.data.labelStructure ?? []).map(mapLabel));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error creating labels', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Put('/labels/:municipalityId/:namespace')
  @OpenAPI({ summary: 'Update labels for a namespace' })
  @UseBefore(authMiddleware)
  @ResponseSchema(LabelsApiResponse)
  async updateLabels(
    @Req() req: RequestWithUser,
    @Res() response: Response<LabelsApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Body() body: { labelStructure: SupportManagementLabel[] },
  ): Promise<Response<LabelsApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/labels`;
      logger.info('PUT labels payload: ' + JSON.stringify(body.labelStructure, null, 2));
      await this.apiService.put<void>({ url, data: body.labelStructure }, req.user);

      const res = await this.apiService.get<Labels>({ url }, req.user);
      const data = sortLabels((res.data.labelStructure ?? []).map(mapLabel));

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating labels', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
