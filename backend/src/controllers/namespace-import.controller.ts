import { NamespaceImportDto } from '@/dtos/namespace-import.dto';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import {
  NamespaceDeleteApiResponse,
  NamespaceDeleteReport,
  NamespaceExportApiResponse,
  NamespaceImportApiResponse,
  NamespaceImportReport,
} from '@/responses/namespace-import.response';
import ApiService from '@/services/api.service';
import { DELETE_SECTION_ORDER, NamespaceDeleteService } from '@/services/namespace-delete.service';
import { NamespaceImportService } from '@/services/namespace-import.service';
import { logger } from '@/utils/logger';
import { buildImportPlan, hasErrors, validateNamespaceImport, validateStructure } from '@/utils/namespace-import-validation';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

/**
 * Whole-namespace export/import. The document format is NamespaceImportDto (see swagger).
 *
 * The import always answers 200 with a NamespaceImportReport: validation problems are
 * reported in `issues` with outcome invalid/conflict rather than as a 400, because the
 * error middleware only forwards a message string and the UI needs the structured list.
 */
@Controller()
export class NamespaceImportController {
  private apiService = new ApiService();

  @Post('/namespaces/:municipalityId/import')
  @OpenAPI({
    summary: 'Validate (dryRun=true) or import a whole namespace from a document',
    description:
      'Validates the document structurally and semantically, checks the target environment and, unless dryRun is set, ' +
      'creates the namespace config, metadata, labels, email integration and feature flags in order. ' +
      'With allowExisting=true an existing namespace is accepted and items that already exist (by name) are skipped.',
  })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @ResponseSchema(NamespaceImportApiResponse)
  async importNamespace(
    @Req() req: RequestWithUser,
    @Res() response: Response<NamespaceImportApiResponse>,
    @Param('municipalityId') municipalityId: number,
    // validate: false so the structural errors reach the report instead of a bare 400.
    @Body({ validate: false }) body: NamespaceImportDto,
    @QueryParam('dryRun') dryRun = false,
    @QueryParam('allowExisting') allowExisting = false,
  ): Promise<Response<NamespaceImportApiResponse>> {
    const report: NamespaceImportReport = {
      outcome: 'invalid',
      dryRun: Boolean(dryRun),
      allowExisting: Boolean(allowExisting),
      namespace: typeof body?.namespace === 'string' ? body.namespace : '',
      issues: [],
      plan: [],
      steps: [],
    };
    const send = () => response.send({ data: report, message: report.outcome });

    report.issues = validateStructure(body);
    if (hasErrors(report.issues)) return send();

    try {
      const service = new NamespaceImportService(this.apiService, req.user, municipalityId);

      const exists = await service.namespaceExists(body.namespace);
      if (exists && !report.allowExisting) {
        report.outcome = 'conflict';
        report.issues.push({
          path: 'namespace',
          message: `Namespacet "${body.namespace}" finns redan. Välj "tillåt befintligt namespace" för att bara skapa det som saknas.`,
          severity: 'error',
        });
        return send();
      }
      const existing = exists ? await service.fetchExistingState(body.namespace) : null;

      report.issues.push(...validateNamespaceImport(body, existing));
      if (hasErrors(report.issues)) return send();

      report.plan = buildImportPlan(body, existing);
      report.outcome = 'valid';
      if (report.dryRun) return send();

      const result = await service.executeImport(body, report.plan);
      report.steps = result.steps;
      report.outcome = result.completed ? 'completed' : 'partial_failure';
      return send();
    } catch (error) {
      logger.error('Error importing namespace', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/namespaces/:municipalityId/:namespace/export')
  @OpenAPI({ summary: 'Export a namespace with its metadata, labels, email integration and feature flags as an import document' })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @ResponseSchema(NamespaceExportApiResponse)
  async exportNamespace(
    @Req() req: RequestWithUser,
    @Res() response: Response<NamespaceExportApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
  ): Promise<Response<NamespaceExportApiResponse>> {
    try {
      const service = new NamespaceImportService(this.apiService, req.user, municipalityId);
      const data = await service.exportNamespace(namespace);
      if (!data) {
        throw new HttpException(404, `Namespacet "${namespace}" finns inte.`);
      }
      return response.send({ data, message: 'success' });
    } catch (error) {
      if (error?.status !== 404) {
        logger.error('Error exporting namespace', error);
      }
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/namespaces/:municipalityId/:namespace')
  @OpenAPI({
    summary: 'Inspect (dryRun=true) or delete a whole namespace',
    description:
      'Deletes the email integration, action configs, phases, labels, every metadata kind, the namespace config and the ' +
      "admin's feature flags, most dependent first. Only available when the backend runs with NAMESPACE_DELETE_ENABLED=true, " +
      'and refused while the namespace still has errands. Always answers 200 with a NamespaceDeleteReport.',
  })
  @UseBefore(authMiddleware, hasPermissions(['canUseAdminPanel']))
  @ResponseSchema(NamespaceDeleteApiResponse)
  async deleteNamespace(
    @Req() req: RequestWithUser,
    @Res() response: Response<NamespaceDeleteApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @QueryParam('dryRun') dryRun = false,
  ): Promise<Response<NamespaceDeleteApiResponse>> {
    const report: NamespaceDeleteReport = {
      outcome: 'not_found',
      dryRun: Boolean(dryRun),
      namespace,
      errandCount: 0,
      plan: [],
      steps: [],
    };
    const send = () => response.send({ data: report, message: report.outcome });

    try {
      const service = new NamespaceDeleteService(this.apiService, req.user, municipalityId);
      if (!service.isDeleteEnabled()) {
        report.outcome = 'disabled';
        return send();
      }
      const inspection = await service.inspect(namespace);
      if (!inspection) return send();

      report.errandCount = inspection.errandCount;
      report.plan = DELETE_SECTION_ORDER.map(section => ({ section, items: inspection.plan[section].map(item => item.label) }));
      if (inspection.errandCount > 0) {
        report.outcome = 'has_errands';
        return send();
      }
      report.outcome = 'ready';
      if (report.dryRun) return send();

      const result = await service.execute(namespace, inspection.plan);
      report.steps = result.steps;
      report.outcome = result.completed ? 'completed' : 'partial_failure';
      return send();
    } catch (error) {
      logger.error('Error deleting namespace', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
