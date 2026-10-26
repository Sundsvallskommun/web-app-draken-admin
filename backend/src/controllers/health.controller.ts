import { User } from '@/interfaces/users.interface';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import { apiServiceName } from '@/config/api-config';
import { Controller, Get } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

@Controller()
export class HealthController {
  private apiService = new ApiService();
  SERVICE = apiServiceName('simulatorserver');

  @Get('/health/up')
  @OpenAPI({ summary: 'Return health check' })
  async up() {
    const url = `${this.SERVICE}/simulations/response?status=200%20OK`;
    const data = {
      status: 'OK',
    };
    const dummyUser: User = {
      name: '',
      username: '',
      permissions: { canUseAdminPanel: false },
      givenName: '',
      surname: '',
    };
    const res = await this.apiService.post<{ status: string }>({ url, data }, dummyUser).catch(e => {
      logger.error('Error when doing health check:', e);
      return e;
    });

    return res.data;
  }
}
