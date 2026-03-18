import { API_COMPARE_URL, CLIENT_KEY_COMPARE, CLIENT_SECRET_COMPARE } from '@config';
import ApiService from './api.service';

let compareInstance: ApiService | null = null;

export function isCompareConfigured(): boolean {
  return !!(API_COMPARE_URL && CLIENT_KEY_COMPARE && CLIENT_SECRET_COMPARE);
}

export function getCompareApiService(): ApiService | null {
  if (!isCompareConfigured()) return null;
  if (!compareInstance) {
    compareInstance = new ApiService(API_COMPARE_URL, CLIENT_KEY_COMPARE, CLIENT_SECRET_COMPARE);
  }
  return compareInstance;
}
