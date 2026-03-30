import qs from 'qs';
import axios from 'axios';
import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@utils/logger';

export interface Token {
  access_token: string;
  expires_in: number;
}

// Shared token cache keyed by baseUrl — all ApiService instances
// with the same credentials reuse the same cached token
const instances = new Map<string, ApiTokenService>();

class ApiTokenService {
  private accessToken = '';
  private tokenExpires = 0;

  private constructor(
    private baseUrl: string,
    private clientKey: string,
    private clientSecret: string,
  ) {}

  static getInstance(baseUrl: string, clientKey: string, clientSecret: string): ApiTokenService {
    const key = baseUrl;
    if (!instances.has(key)) {
      instances.set(key, new ApiTokenService(baseUrl, clientKey, clientSecret));
    }
    return instances.get(key);
  }

  public async getToken(): Promise<string> {
    if (Date.now() >= this.tokenExpires) {
      logger.info(`Getting oauth API token for ${this.baseUrl}`);
      await this.fetchToken();
    }
    return this.accessToken;
  }

  private setToken(token: Token) {
    this.accessToken = token.access_token;
    // NOTE: Set timestamp for when we need to refresh minus 10 seconds for margin
    this.tokenExpires = Date.now() + (token.expires_in * 1000 - 10000);

    logger.info(`Token valid for: ${token.expires_in}`);
    logger.info(`Current time: ${new Date()}`);
    logger.info(`Token expires at: ${new Date(this.tokenExpires)}`);
  }

  private async fetchToken(): Promise<string> {
    const authString = Buffer.from(`${this.clientKey}:${this.clientSecret}`, 'utf-8').toString('base64');

    try {
      const { data } = await axios({
        timeout: 30000, // NOTE: milliseconds
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + authString,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify({
          grant_type: 'client_credentials',
        }),
        url: `${this.baseUrl}/token`,
      });
      const token = data as Token;

      if (!token) throw new HttpException(502, 'Bad Gateway');
      this.setToken(token);

      return this.getToken();
    } catch (error) {
      logger.error(`Failed to fetch JWT access token: ${JSON.stringify(error)}`);
      throw new HttpException(502, 'Bad Gateway');
    }
  }
}

export default ApiTokenService;
