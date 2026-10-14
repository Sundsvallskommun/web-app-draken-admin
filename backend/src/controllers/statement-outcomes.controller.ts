import { apiServiceName } from '@/config/api-config';
import { StatementOutcome as supportmanagementStatementOutcome, NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { StatementOutcomeRequestDto, StatementOutcomeUpdateDto } from '@/dtos/statement-outcome.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import {
  StatementOutcome,
  StatementOutcomeApiResponse,
  StatementOutcomeDeleteApiResponse,
  StatementOutcomesApiResponse,
} from '@/responses/statement-outcome.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Patch, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

/**
 * Statement outcomes are namespace metadata in Support Management
 * (`/{municipalityId}/{namespace}/metadata/statementoutcomes`). They are the
 * selectable outcomes of a statement request on an errand. `responded` tells
 * whether the outcome means the counterparty answered (a statement completed
 * with such an outcome needs a respondedAt) or not, e.g. no answer in time.
 */
export const mapStatementOutcome = (outcome: supportmanagementStatementOutcome, namespace: string): StatementOutcome => ({
  id: outcome.id,
  name: outcome.name,
  displayName: outcome.displayName ?? undefined,
  sortOrder: outcome.sortOrder ?? undefined,
  responded: outcome.responded ?? true,
  deprecated: outcome.deprecated ?? false,
  namespace,
  createdAt: outcome.created,
  updatedAt: outcome.modified,
});

@Controller()
export class StatementOutcomesController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private outcomesUrl(municipalityId: number, namespace: string, id?: string): string {
    const base = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/statementoutcomes`;
    return id ? `${base}/${id}` : base;
  }

  @Post('/statement-outcomes/:municipalityId')
  @OpenAPI({ summary: 'Create new statement outcome' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatementOutcomeApiResponse)
  async createStatementOutcome(
    @Req() req: RequestWithUser,
    @Body() body: StatementOutcomeRequestDto,
    @Res() response: Response<StatementOutcomeApiResponse>,
    @Param('municipalityId') municipalityId: number,
  ): Promise<Response<StatementOutcomeApiResponse>> {
    try {
      const url = this.outcomesUrl(municipalityId, body.namespace);

      const outcomeData: supportmanagementStatementOutcome = {
        name: body.name,
        displayName: body.displayName,
        sortOrder: body.sortOrder,
        responded: body.responded ?? true,
        deprecated: body.deprecated ?? false,
      };

      const postRes = await this.apiService.post<supportmanagementStatementOutcome>({ url, data: outcomeData }, req.user);

      if (postRes.data?.id) {
        const res = await this.apiService.get<supportmanagementStatementOutcome>(
          { url: this.outcomesUrl(municipalityId, body.namespace, postRes.data.id) },
          req.user,
        );
        return response.send({ data: mapStatementOutcome(res.data, body.namespace), message: 'success' });
      }

      // The gateway answers 201 with a Location header and no body: list and find by name
      const listRes = await this.apiService.get<supportmanagementStatementOutcome[]>({ url }, req.user);
      const created = listRes.data.find(outcome => outcome.name === body.name);
      if (!created) {
        throw new HttpException(500, 'Statement outcome was created but could not be read back');
      }

      return response.send({ data: mapStatementOutcome(created, body.namespace), message: 'success' });
    } catch (error) {
      logger.error('Error creating statement outcome', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/statement-outcomes/:municipalityId')
  @OpenAPI({ summary: 'Get all statement outcomes' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatementOutcomesApiResponse)
  async getStatementOutcomes(
    @Req() req: RequestWithUser,
    @Res() response: Response<StatementOutcomesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<StatementOutcomesApiResponse>> {
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
            .get<supportmanagementStatementOutcome[]>({ url: this.outcomesUrl(municipalityId, ns) }, req.user)
            .then(res => ({ namespace: ns, outcomes: res.data })),
        ),
      );

      const data: StatementOutcome[] = outcomeResponses.flatMap(({ namespace: ns, outcomes }) =>
        outcomes.map(outcome => mapStatementOutcome(outcome, ns)),
      );

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting statement outcomes', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/statement-outcomes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Get a statement outcome by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatementOutcomeApiResponse)
  async getStatementOutcome(
    @Req() req: RequestWithUser,
    @Res() response: Response<StatementOutcomeApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<StatementOutcomeApiResponse>> {
    try {
      const res = await this.apiService.get<supportmanagementStatementOutcome>({ url: this.outcomesUrl(municipalityId, namespace, id) }, req.user);
      return response.send({ data: mapStatementOutcome(res.data, namespace), message: 'success' });
    } catch (error) {
      logger.error('Error getting statement outcome', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Patch('/statement-outcomes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Update a statement outcome by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatementOutcomeApiResponse)
  async updateStatementOutcome(
    @Req() req: RequestWithUser,
    @Body() body: StatementOutcomeUpdateDto,
    @Res() response: Response<StatementOutcomeApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<StatementOutcomeApiResponse>> {
    try {
      const url = this.outcomesUrl(municipalityId, namespace, id);

      // Fetch current to preserve the immutable name key (required by the gateway)
      const current = await this.apiService.get<supportmanagementStatementOutcome>({ url }, req.user);

      const patchData: supportmanagementStatementOutcome = {
        name: current.data.name,
      };
      if (body.displayName !== undefined) {
        patchData.displayName = body.displayName;
      }
      if (body.sortOrder !== undefined) {
        patchData.sortOrder = body.sortOrder;
      }
      if (body.responded !== undefined) {
        patchData.responded = body.responded;
      }
      if (body.deprecated !== undefined) {
        patchData.deprecated = body.deprecated;
      }

      await this.apiService.patch<supportmanagementStatementOutcome>({ url, data: patchData }, req.user);

      const res = await this.apiService.get<supportmanagementStatementOutcome>({ url }, req.user);
      return response.send({ data: mapStatementOutcome(res.data, namespace), message: 'success' });
    } catch (error) {
      logger.error('Error updating statement outcome', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/statement-outcomes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Delete a statement outcome by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(StatementOutcomeDeleteApiResponse)
  async deleteStatementOutcome(
    @Req() req: RequestWithUser,
    @Res() response: Response<ApiResponse<boolean>>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<ApiResponse<boolean>>> {
    try {
      await this.apiService.delete<{}>({ url: this.outcomesUrl(municipalityId, namespace, id) }, req.user);
      return response.send({ data: true, message: 'Statement outcome deleted successfully' });
    } catch (error) {
      logger.error('Error deleting statement outcome', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
