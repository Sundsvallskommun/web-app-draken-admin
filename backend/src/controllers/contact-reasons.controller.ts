import { apiServiceName } from '@/config/api-config';
import { ContactReason as supportmanagementContactReason, NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { ContactReasonRequestDto, ContactReasonUpdateDto } from '@/dtos/contact-reason.dto';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import {
  ContactReason,
  ContactReasonApiResponse,
  ContactReasonDeleteApiResponse,
  ContactReasonsApiResponse,
} from '@/responses/contact-reason.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Delete, Get, Param, Patch, Post, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class ContactReasonsController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private mapContactReason(contactReason: supportmanagementContactReason, namespace: string): ContactReason {
    return {
      id: contactReason.id,
      reason: contactReason.reason,
      displayName: contactReason.displayName,
      namespace,
      createdAt: contactReason.created,
      updatedAt: contactReason.modified,
    };
  }

  @Post('/contact-reasons/:municipalityId')
  @OpenAPI({ summary: 'Create new contact reason' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ContactReasonApiResponse)
  async createContactReason(
    @Req() req: RequestWithUser,
    @Body() body: ContactReasonRequestDto,
    @Res() response: Response<ContactReasonApiResponse>,
    @Param('municipalityId') municipalityId: number,
  ): Promise<Response<ContactReasonApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${body.namespace}/metadata/contactreasons`;

      const contactReasonData: supportmanagementContactReason = {
        reason: body.reason,
        displayName: body.displayName,
      };

      const postRes = await this.apiService.post<supportmanagementContactReason>({ url, data: contactReasonData }, req.user);

      if (postRes.data?.id) {
        const fetchUrl = `${this.SERVICE}/${municipalityId}/${body.namespace}/metadata/contactreasons/${postRes.data.id}`;
        const res = await this.apiService.get<supportmanagementContactReason>({ url: fetchUrl }, req.user);
        const data = this.mapContactReason(res.data, body.namespace);
        return response.send({ data, message: 'success' });
      }

      // Fallback: list and find by reason
      const listRes = await this.apiService.get<supportmanagementContactReason[]>({ url }, req.user);
      const created = listRes.data.find(cr => cr.reason === body.reason);
      const data = this.mapContactReason(created, body.namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error creating contact reason', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/contact-reasons/:municipalityId')
  @OpenAPI({ summary: 'Get all contact reasons' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ContactReasonsApiResponse)
  async getContactReasons(
    @Req() req: RequestWithUser,
    @Res() response: Response<ContactReasonsApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @QueryParam('namespace') namespace?: string,
  ): Promise<Response<ContactReasonsApiResponse>> {
    try {
      let namespacesToSearch: string[] = [];

      if (namespace) {
        namespacesToSearch = [namespace];
      } else {
        const namespacesUrl = `${this.SERVICE}/namespace-configs?municipalityId=${municipalityId}`;
        const namespacesRes = await this.apiService.get<NamespaceConfig[]>({ url: namespacesUrl }, req.user);
        namespacesToSearch = namespacesRes.data.map(n => n.namespace);
      }

      const contactReasonResponses = await Promise.all(
        namespacesToSearch.map(ns => {
          const url = `${this.SERVICE}/${municipalityId}/${ns}/metadata/contactreasons`;
          return this.apiService.get<supportmanagementContactReason[]>({ url }, req.user).then(res => ({
            namespace: ns,
            contactReasons: res.data,
          }));
        }),
      );

      const data: ContactReason[] = contactReasonResponses.flatMap(({ namespace: ns, contactReasons }) =>
        contactReasons.map(cr => this.mapContactReason(cr, ns)),
      );

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting contact reasons', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Get('/contact-reasons/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Get a contact reason by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ContactReasonApiResponse)
  async getContactReason(
    @Req() req: RequestWithUser,
    @Res() response: Response<ContactReasonApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<ContactReasonApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/contactreasons/${id}`;
      const res = await this.apiService.get<supportmanagementContactReason>({ url }, req.user);
      const data = this.mapContactReason(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error getting contact reason', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Patch('/contact-reasons/:municipalityId/:namespace/:id')
  @OpenAPI({ summary: 'Update a contact reason by UUID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ContactReasonApiResponse)
  async updateContactReason(
    @Req() req: RequestWithUser,
    @Body() body: ContactReasonUpdateDto,
    @Res() response: Response<ContactReasonApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
    @Param('id') id: string,
  ): Promise<Response<ContactReasonApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/contactreasons/${id}`;

      // Fetch current to get required reason field
      const current = await this.apiService.get<supportmanagementContactReason>({ url }, req.user);

      const patchData: Partial<supportmanagementContactReason> = {
        reason: body.reason ?? current.data.reason,
      };
      if (body.displayName !== undefined) {
        patchData.displayName = body.displayName;
      }

      await this.apiService.patch<supportmanagementContactReason>({ url, data: patchData }, req.user);

      const res = await this.apiService.get<supportmanagementContactReason>({ url }, req.user);
      const data = this.mapContactReason(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating contact reason', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Delete('/contact-reasons/:municipalityId/:namespace/:id')
  @ResponseSchema(ContactReasonDeleteApiResponse)
  async deleteContactReason(
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
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/metadata/contactreasons/${id}`;
      await this.apiService.delete<{}>({ url }, req.user);
      return response.send({ data: true, message: 'Contact reason deleted successfully' });
    } catch (error) {
      logger.error('Error deleting contact reason', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
