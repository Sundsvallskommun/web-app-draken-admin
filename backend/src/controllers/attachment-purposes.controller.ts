import { apiServiceName } from '@/config/api-config';
import { AttachmentPurpose as supportmanagementAttachmentPurpose, NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { AttachmentPurposeRequestDto, AttachmentPurposeUpdateDto } from '@/dtos/attachment-purpose.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import {
  AttachmentPurpose,
  AttachmentPurposeApiResponse,
  AttachmentPurposeDeleteApiResponse,
  AttachmentPurposesApiResponse,
} from '@/responses/attachment-purpose.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Patch, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

/**
 * Attachment purposes are namespace metadata in Support Management
 * (`/{municipalityId}/{namespace}/metadata/attachmentpurposes`). They tag what an
 * errand attachment is for and are only used by the sprint API for now.
 */
export const mapAttachmentPurpose = (purpose: supportmanagementAttachmentPurpose, namespace: string): AttachmentPurpose => ({
  id: purpose.id,
  name: purpose.name,
  displayName: purpose.displayName ?? undefined,
  sortOrder: purpose.sortOrder ?? undefined,
  deprecated: purpose.deprecated ?? false,
  namespace,
  createdAt: purpose.created,
  updatedAt: purpose.modified,
});

@Controller()
export class AttachmentPurposesController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private purposesUrl(municipalityId: number, namespace: string, id?: string): string {
    const base = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/attachmentpurposes`;
    return id ? `${base}/${id}` : base;
  }

  @Post('/attachment-purposes/:municipalityId')
  @OpenAPI({ summary: 'Create new attachment purpose' })
  @UseBefore(authMiddleware)
  @ResponseSchema(AttachmentPurposeApiResponse)
  async createAttachmentPurpose(
    @Req() req: RequestWithUser,
    @Body() body: AttachmentPurposeRequestDto,
    @Res() response: Response<AttachmentPurposeApiResponse>,
    @Param('municipalityId') municipalityId: number,
  ): Promise<Response<AttachmentPurposeApiResponse>> {
    try {
      const url = this.purposesUrl(municipalityId, body.namespace);

      const purposeData: supportmanagementAttachmentPurpose = {
        name: body.name,
        displayName: body.displayName,
        sortOrder: body.sortOrder,
        deprecated: body.deprecated ?? false,
      };

      const postRes = await this.apiService.post<supportmanagementAttachmentPurpose>({ url, data: purposeData }, req.user);

      if (postRes.data?.id) {
        const res = await this.apiService.get<supportmanagementAttachmentPurpose>(
          { url: this.purposesUrl(municipalityId, body.namespace, postRes.data.id) },
          req.user,
        );
        return response.send({ data: mapAttachmentPurpose(res.data, body.namespace), message: 'success' });
      }

      // The gateway answers 201 with a Location header and no body: list and find by name
      const listRes = await this.apiService.get<supportmanagementAttachmentPurpose[]>({ url }, req.user);
      const created = listRes.data.find(purpose => purpose.name === body.name);
      if (!created) {
        throw new HttpException(500, 'Attachment purpose was created but could not be read back');
      }

      return response.send({ data: mapAttachmentPurpose(created, body.namespace), message: 'success' });
    } catch (error) {
      logger.error('Error creating attachment purpose', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/attachment-purposes/:municipalityId')
  @OpenAPI({ summary: 'Get all attachment purposes' })
  @UseBefore(authMiddleware)
  @ResponseSchema(AttachmentPurposesApiResponse)
  async getAttachmentPurposes(
    @Req() req: RequestWithUser,
    @Res() response: Response<AttachmentPurposesApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<AttachmentPurposesApiResponse>> {
    try {
      let namespacesToSearch: string[] = [];

      if (namespace) {
        namespacesToSearch = [namespace];
      } else {
        const namespacesUrl = `${this.SERVICE}/namespace-configs?municipalityId=${municipalityId}`;
        const namespacesRes = await this.apiService.get<NamespaceConfig[]>({ url: namespacesUrl }, req.user);
        namespacesToSearch = namespacesRes.data.map(n => n.namespace);
      }

      const purposeResponses = await Promise.all(
        namespacesToSearch.map(ns =>
          this.apiService
            .get<supportmanagementAttachmentPurpose[]>({ url: this.purposesUrl(municipalityId, ns) }, req.user)
            .then(res => ({ namespace: ns, purposes: res.data })),
        ),
      );

      const data: AttachmentPurpose[] = purposeResponses.flatMap(({ namespace: ns, purposes }) =>
        purposes.map(purpose => mapAttachmentPurpose(purpose, ns)),
      );

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting attachment purposes', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/attachment-purposes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Get an attachment purpose by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(AttachmentPurposeApiResponse)
  async getAttachmentPurpose(
    @Req() req: RequestWithUser,
    @Res() response: Response<AttachmentPurposeApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<AttachmentPurposeApiResponse>> {
    try {
      const res = await this.apiService.get<supportmanagementAttachmentPurpose>({ url: this.purposesUrl(municipalityId, namespace, id) }, req.user);
      return response.send({ data: mapAttachmentPurpose(res.data, namespace), message: 'success' });
    } catch (error) {
      logger.error('Error getting attachment purpose', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Patch('/attachment-purposes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Update an attachment purpose by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(AttachmentPurposeApiResponse)
  async updateAttachmentPurpose(
    @Req() req: RequestWithUser,
    @Body() body: AttachmentPurposeUpdateDto,
    @Res() response: Response<AttachmentPurposeApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<AttachmentPurposeApiResponse>> {
    try {
      const url = this.purposesUrl(municipalityId, namespace, id);

      // Fetch current to preserve the immutable name key (required by the gateway)
      const current = await this.apiService.get<supportmanagementAttachmentPurpose>({ url }, req.user);

      const patchData: supportmanagementAttachmentPurpose = {
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

      await this.apiService.patch<supportmanagementAttachmentPurpose>({ url, data: patchData }, req.user);

      const res = await this.apiService.get<supportmanagementAttachmentPurpose>({ url }, req.user);
      return response.send({ data: mapAttachmentPurpose(res.data, namespace), message: 'success' });
    } catch (error) {
      logger.error('Error updating attachment purpose', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/attachment-purposes/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Delete an attachment purpose by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(AttachmentPurposeDeleteApiResponse)
  async deleteAttachmentPurpose(
    @Req() req: RequestWithUser,
    @Res() response: Response<ApiResponse<boolean>>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<ApiResponse<boolean>>> {
    try {
      await this.apiService.delete<{}>({ url: this.purposesUrl(municipalityId, namespace, id) }, req.user);
      return response.send({ data: true, message: 'Attachment purpose deleted successfully' });
    } catch (error) {
      logger.error('Error deleting attachment purpose', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
