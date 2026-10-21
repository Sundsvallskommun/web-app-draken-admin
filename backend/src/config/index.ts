import { config } from 'dotenv';
import { APIS, useApiVersion } from './api-config';

export { APIS, useApiVersion };

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const SWAGGER_ENABLED = process.env.SWAGGER_ENABLED === 'true';
export const SESSION_MEMORY = process.env.SESSION_MEMORY === 'true';
// Global switch for the whole-namespace delete (DELETE /namespaces/:municipalityId/:namespace). Off unless "true".
export const NAMESPACE_DELETE_ENABLED = process.env.NAMESPACE_DELETE_ENABLED === 'true';
// Set to "false" to drop the API version from gateway URLs so the latest version is called.
export const USE_API_VERSION = useApiVersion();

export const {
  MUNICIPALITY_ID,
  APP_NAME,
  NODE_ENV,
  PORT,
  API_BASE_URL,
  LOG_FORMAT,
  LOG_DIR,
  ORIGIN,
  SECRET_KEY,
  CLIENT_KEY,
  CLIENT_SECRET,
  BASE_URL_PREFIX,
  SAML_CALLBACK_URL,
  SAML_LOGOUT_CALLBACK_URL,
  SAML_SUCCESS_BASE,
  SAML_SUCCESS_REDIRECT,
  SAML_FAILURE_REDIRECT,
  SAML_FAILURE_REDIRECT_MESSAGE,
  SAML_LOGOUT_REDIRECT,
  SAML_ENTRY_SSO,
  SAML_AUDIENCE,
  SAML_ISSUER,
  SAML_IDP_PUBLIC_CERT,
  SAML_PRIVATE_KEY,
  SAML_PUBLIC_KEY,
  ADMIN_PANEL_GROUP,
  API_COMPARE_URL,
  CLIENT_KEY_COMPARE,
  CLIENT_SECRET_COMPARE,
} = process.env;
