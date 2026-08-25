import { apiServiceName } from '@/config/api-config';
import { EmailIntegration } from '@/data-contracts/supportmanagement/data-contracts';
import { EmailIntegrationDto } from '@/dtos/email-integration.dto';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { EmailIntegrationApiResponse, EmailIntegrationData } from '@/responses/email-integration.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import authMiddleware from '@middlewares/auth.middleware';
import { Response } from 'express';
import { Body, Controller, Get, Param, Put, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class EmailIntegrationController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('supportmanagement');

  private mapEmailIntegration(data: EmailIntegration, namespace: string): EmailIntegrationData {
    return {
      enabled: data.enabled,
      errandClosedEmailSender: data.errandClosedEmailSender,
      errandClosedEmailTemplate: data.errandClosedEmailTemplate,
      errandClosedEmailHTMLTemplate: data.errandClosedEmailHTMLTemplate,
      errandNewEmailSender: data.errandNewEmailSender,
      errandNewEmailTemplate: data.errandNewEmailTemplate,
      errandNewEmailHTMLTemplate: data.errandNewEmailHTMLTemplate,
      daysOfInactivityBeforeReject:
        typeof data.daysOfInactivityBeforeReject === 'string' ? parseInt(data.daysOfInactivityBeforeReject, 10) : data.daysOfInactivityBeforeReject,
      statusForNew: data.statusForNew,
      triggerStatusChangeOn: data.triggerStatusChangeOn,
      statusChangeTo: data.statusChangeTo,
      inactiveStatus: data.inactiveStatus,
      addSenderAsStakeholder: typeof data.addSenderAsStakeholder === 'string' ? data.addSenderAsStakeholder === 'true' : data.addSenderAsStakeholder,
      stakeholderRole: data.stakeholderRole,
      errandChannel: data.errandChannel,
      ignoreAutoReply: data.ignoreAutoReply,
      ignoreNoReply: data.ignoreNoReply,
      namespace,
      createdAt: data.created,
      updatedAt: data.modified,
    };
  }

  @Get('/email-integration/:municipalityId/:namespace')
  @OpenAPI({ summary: 'Get email integration config for a namespace' })
  @UseBefore(authMiddleware)
  @ResponseSchema(EmailIntegrationApiResponse)
  async getEmailIntegration(
    @Req() req: RequestWithUser,
    @Res() response: Response<EmailIntegrationApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
  ): Promise<Response<EmailIntegrationApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/email-integration-config`;
      const res = await this.apiService.get<EmailIntegration>({ url }, req.user);
      const data = this.mapEmailIntegration(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      if (error?.status === 404) {
        return response.send({ data: null, message: 'not_found' });
      }
      logger.error('Error getting email integration', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }

  @Put('/email-integration/:municipalityId/:namespace')
  @OpenAPI({ summary: 'Update email integration config for a namespace' })
  @UseBefore(authMiddleware)
  @ResponseSchema(EmailIntegrationApiResponse)
  async updateEmailIntegration(
    @Req() req: RequestWithUser,
    @Body() body: EmailIntegrationDto,
    @Res() response: Response<EmailIntegrationApiResponse>,
    @Param('municipalityId') municipalityId: number,
    @Param('namespace') namespace: string,
  ): Promise<Response<EmailIntegrationApiResponse>> {
    try {
      const url = `${this.SERVICE}/${municipalityId}/${namespace}/email-integration-config`;

      const emailData: EmailIntegration = {
        enabled: body.enabled,
        errandClosedEmailSender: body.errandClosedEmailSender,
        errandClosedEmailTemplate: body.errandClosedEmailTemplate,
        errandClosedEmailHTMLTemplate: body.errandClosedEmailHTMLTemplate,
        errandNewEmailSender: body.errandNewEmailSender,
        errandNewEmailTemplate: body.errandNewEmailTemplate,
        errandNewEmailHTMLTemplate: body.errandNewEmailHTMLTemplate,
        // The supportmanagement contract types these as string|null, so serialise the
        // DTO's number/boolean to string before sending. mapEmailIntegration reverses this on read.
        daysOfInactivityBeforeReject: body.daysOfInactivityBeforeReject?.toString(),
        statusForNew: body.statusForNew,
        triggerStatusChangeOn: body.triggerStatusChangeOn,
        statusChangeTo: body.statusChangeTo,
        inactiveStatus: body.inactiveStatus,
        addSenderAsStakeholder: body.addSenderAsStakeholder?.toString(),
        stakeholderRole: body.stakeholderRole,
        errandChannel: body.errandChannel,
        ignoreAutoReply: body.ignoreAutoReply,
        ignoreNoReply: body.ignoreNoReply,
      };

      await this.apiService.put<EmailIntegration>({ url, data: emailData }, req.user);

      const res = await this.apiService.get<EmailIntegration>({ url }, req.user);
      const data = this.mapEmailIntegration(res.data, namespace);

      return response.send({ data, message: 'success' });
    } catch (error) {
      logger.error('Error updating email integration', error);
      throw new HttpException(error?.status ?? 500, error?.message ?? 'Internal Server Error');
    }
  }
}
