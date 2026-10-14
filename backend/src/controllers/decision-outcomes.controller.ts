import { apiServiceName } from '@/config/api-config';
import { DecisionOutcome as supportmanagementDecisionOutcome, NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { DecisionOutcomeRequestDto, DecisionOutcomeUpdateDto } from '@/dtos/decision-outcome.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import {
  DecisionOutcome,
  DecisionOutcomeApiResponse,
  DecisionOutcomeDeleteApiResponse,
  DecisionOutcomesApiResponse,
} from '@/responses/decision-outcome.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Patch, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

/**
 * Decision outcomes are namespace metadata in Support Management
 * (`/{municipalityId}/{namespace}/metadata/decisionoutcomes`). They are the
 * selectable outcomes of a decision on an errand.
 */
export const mapDecisionOutcome = (outcome: supportmanagementDecisionOutcome, namespace: string): DecisionOutcome => ({
  id: outcome.id,
  name: outcome.name,
  displayName: outcome.displayName ?? undefined,
  sortOrder: outcome.sortOrder ?? undefined,
  deprecated: outcome.deprecated ?? false,
  namespace,
  createdAt: outcome.created,
  updatedAt: outcome.modified,
});

@Controller()
export class DecisionOutcomesController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private outcomesUrl(municipalityId: number, namespace: string, id?: string): string {
    const base = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/decisionoutcomes`;
    return id ? `${base}/${id}` : base;
  }

  @Post('/decision-outcomes/:municipalityId')
  @OpenAPI({ summary: 'Create new decision outcome' })
  @UseBefore(authMiddleware)
  @ResponseSchema(DecisionOutcomeApiResponse)
  async createDecisionOutcome(
    @Req() req: RequestWithUser,
    @Body() body: DecisionOutcomeRequestDto,
    @Res() response: Response<DecisionOutcomeApiResponse>,
    @Param('municipalityId') municipalityId: number,
  ): Promise<Response<DecisionOutcomeApiResponse>> {
    try {
      const url = this.outcomesUrl(municipalityId, body.namespace);

      const outcomeData: supportmanagementDecisionOutcome = {
        name: body.name,
        displayName: body.displayName,
        sortOrder: body.sortOrder,
        deprecated: body.deprecated ?? false,
      };

      const postRes = await this.apiService.post<supportmanagementDecisionOutcome>({ url, data: outcomeData }, req.user);

      if (postRes.data?.id) {
        const res = await this.apiService.get<supportmanagementDecisionOutcome>(
          { url: this.outcomesUrl(municipalityId, body.namespace, postRes.data.id) },
          req.user,
        );
        return response.send({ data: mapDecisionOutcome(res.data, body.namespace), message: 'success' });
      }

      // The gateway answers 201 with a Location header and no body: list and find by name
      const listRes = await this.apiService.get<supportmanagementDecisionOutcome[]>({ url }, req.user);
      const created = listRes.data.find(outcome => outcome.name === body.name);
      if (!created) {
        throw new HttpException(500, 'Decision outcome was created but could not be read back');
      }

      return response.send({ data: mapDecisionOutcome(created, body.namespace), message: 'success' });
    } catch (error) {
      logger.error('Error creating decision outcome', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/decision-outcomes/:municipalityId')
  @OpenAPI({ summary: 'Get all decision outcomes' })
  @UseBefore(authMiddleware)
  @ResponseSchema(DecisionOutcomesApiResponse)
  async getDecisionOutcomes(
    @Req() req: RequestWithUser,
    @Res() response: Response<DecisionOutcomesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<DecisionOutcomesApiResponse>> {
    try {
      let namespacesToSearch: string[] = [];

      if (namespace) {
        namespacesToSearch = [namespace];
      } else {
        const namespacesUrl = `${this.SERVICE}/namespace-configs?municipalityId=${municipalityId}`;
        const namespacesRes = await this.apiService.get<NamespaceConfig[]>({ url: namespacesUrl }, req.user);
        namespacesToSearch = namespacesRes.data.map(n => n.namespace);
      }

      const outcomeResponses = await Promise.all(
        namespacesToSearch.map(ns =>
          this.apiService
            .get<supportmanagementDecisionOutcome[]>({ url: this.outcomesUrl(municipalityId, ns) }, req.user)
            .then(res => ({ namespace: ns, outcomes: res.data })),
        ),
      );

      const data: DecisionOutcome[] = outcomeResponses.flatMap(({ namespace: ns, outcomes }) =>
        outcomes.map(outcome => mapDecisionOutcome(outcome, ns)),
      );

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting decision outcomes', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/decision-outcomes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Get a decision outcome by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(DecisionOutcomeApiResponse)
  async getDecisionOutcome(
    @Req() req: RequestWithUser,
    @Res() response: Response<DecisionOutcomeApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<DecisionOutcomeApiResponse>> {
    try {
      const res = await this.apiService.get<supportmanagementDecisionOutcome>({ url: this.outcomesUrl(municipalityId, namespace, id) }, req.user);
      return response.send({ data: mapDecisionOutcome(res.data, namespace), message: 'success' });
    } catch (error) {
      logger.error('Error getting decision outcome', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Patch('/decision-outcomes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Update a decision outcome by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(DecisionOutcomeApiResponse)
  async updateDecisionOutcome(
    @Req() req: RequestWithUser,
    @Body() body: DecisionOutcomeUpdateDto,
    @Res() response: Response<DecisionOutcomeApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<DecisionOutcomeApiResponse>> {
    try {
      const url = this.outcomesUrl(municipalityId, namespace, id);

      // Fetch current to preserve the immutable name key (required by the gateway)
      const current = await this.apiService.get<supportmanagementDecisionOutcome>({ url }, req.user);

      const patchData: supportmanagementDecisionOutcome = {
        name: current.data.name,
      };
      if (body.displayName !== undefined) {
        patchData.displayName = body.displayName;
      }
      if (body.sortOrder !== undefined) {
        patchData.sortOrder = body.sortOrder;
      }
      if (body.deprecated !== undefined) {
        patchData.deprecated = body.deprecated;
      }

      await this.apiService.patch<supportmanagementDecisionOutcome>({ url, data: patchData }, req.user);

      const res = await this.apiService.get<supportmanagementDecisionOutcome>({ url }, req.user);
      return response.send({ data: mapDecisionOutcome(res.data, namespace), message: 'success' });
    } catch (error) {
      logger.error('Error updating decision outcome', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/decision-outcomes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Delete a decision outcome by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(DecisionOutcomeDeleteApiResponse)
  async deleteDecisionOutcome(
    @Req() req: RequestWithUser,
    @Res() response: Response<ApiResponse<boolean>>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<ApiResponse<boolean>>> {
    try {
      await this.apiService.delete<{}>({ url: this.outcomesUrl(municipalityId, namespace, id) }, req.user);
      return response.send({ data: true, message: 'Decision outcome deleted successfully' });
    } catch (error) {
      logger.error('Error deleting decision outcome', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
