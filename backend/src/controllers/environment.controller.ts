import { API_BASE_URL, NAMESPACE_DELETE_ENABLED } from '@config';
import ApiResponse from '@/interfaces/api-service.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { adminEnvironmentFromApiBaseUrl, type AdminEnvironment } from '@utils/admin-environment';
import { Controller, Get, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

@Controller()
export class EnvironmentController {
  @Get('/admin/environment')
  @OpenAPI({ summary: 'Get current admin environment and which admin-wide features are enabled' })
  @UseBefore(authMiddleware)
  async getAdminEnvironment(): Promise<ApiResponse<AdminEnvironment>> {
    return { data: { ...adminEnvironmentFromApiBaseUrl(API_BASE_URL), namespaceDeleteEnabled: NAMESPACE_DELETE_ENABLED }, message: 'success' };
  }
}
