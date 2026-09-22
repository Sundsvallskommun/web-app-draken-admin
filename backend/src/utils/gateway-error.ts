import { APIS } from '@/config/api-config';
import axios from 'axios';

/**
 * WSO2 returns its own error envelope, and does so in two shapes: wrapped (`{ fault: {...} }`)
 * and bare (`{ code, message, description }`). Both are handled below.
 */
const FAULT_SUBSCRIPTION_MISSING = 900908;
const FAULT_INVALID_CREDENTIALS = 900901;
const FAULT_MISSING_CREDENTIALS = 900902;

interface GatewayFault {
  code?: number | string;
  message?: string;
  description?: string;
}

export interface GatewayFailure {
  status: number;
  message: string;
}

/** Strip CR/LF so upstream-controlled strings cannot forge extra log lines. */
export const sanitizeLogInput = (input: string): string => String(input).replace(/[\r\n]/g, ' ');

/**
 * Pick the `<name>/<version>` pair out of a gateway URL, e.g.
 * `https://api-test.sundsvall.se/supportmanagement/15.2/2281/...` -> `supportmanagement/15.2`.
 * Matched against the names declared in api-config.ts so an ordinary path segment
 * cannot be mistaken for an API.
 */
export function apiFromUrl(url: string): string | undefined {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    // NOTE: not an absolute URL (custom compare base) - fall back to the raw string
  }

  const segments = pathname.split('/').filter(Boolean);
  const start = segments.findIndex(segment => APIS.some(api => api.name === segment.toLowerCase()));
  if (start === -1) return undefined;

  return segments.slice(start, start + 2).join('/');
}

/** Readable, length-capped rendering of an upstream response body. */
export function serializeBody(data: unknown, maxLength = 500): string {
  if (data === undefined || data === null) return '<no body>';

  let text: string;
  if (typeof data === 'string') {
    text = data;
  } else {
    try {
      text = JSON.stringify(data);
    } catch {
      text = String(data);
    }
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/** Accepts both the wrapped and the bare WSO2 fault shape. */
function faultOf(data: unknown): GatewayFault | undefined {
  if (!data || typeof data !== 'object') return undefined;

  const wrapped = (data as { fault?: GatewayFault }).fault;
  const fault = wrapped && typeof wrapped === 'object' ? wrapped : (data as GatewayFault);

  return fault.code !== undefined || fault.description !== undefined ? fault : undefined;
}

const hasCode = (fault: GatewayFault | undefined, code: number): boolean => Number(fault?.code) === code;

/**
 * A 404 from the gateway's own router ("No matching resource found") means the API
 * version in api-config.ts does not exist - not that the record is missing. Telling
 * the two apart matters: callers treat a plain 404 as "empty result" and swallow it.
 */
function isRoutingFault(fault: GatewayFault | undefined): boolean {
  return /no matching resource found/i.test(fault?.description ?? '');
}

/**
 * Turn a gateway failure into a status and a message that name *which* API failed and why,
 * so a missing WSO2 subscription or a wrong API version does not read as a generic 500.
 */
export function classifyGatewayFailure(method: string, url: string, status: number | undefined, data: unknown): GatewayFailure {
  const api = apiFromUrl(url);
  const target = api ? `API "${api}"` : `${method} ${url}`;
  const fault = faultOf(data);

  if (hasCode(fault, FAULT_SUBSCRIPTION_MISSING) || (status === 403 && /subscription/i.test(fault?.description ?? ''))) {
    return {
      status: 502,
      message: `Missing API subscription for ${target}. The WSO2 application behind CLIENT_KEY must subscribe to this exact version - see backend/src/config/api-config.ts.`,
    };
  }

  if (status === 404 && isRoutingFault(fault)) {
    return {
      status: 502,
      message: `The gateway has no ${target}. That API version does not exist - check the version in backend/src/config/api-config.ts.`,
    };
  }

  if (hasCode(fault, FAULT_INVALID_CREDENTIALS) || hasCode(fault, FAULT_MISSING_CREDENTIALS) || status === 401) {
    return { status: 502, message: `The gateway rejected the credentials when calling ${target}. Check CLIENT_KEY and CLIENT_SECRET.` };
  }

  if (status === 404) {
    return { status: 404, message: 'Not found' };
  }

  const detail = fault?.description ?? fault?.message ?? serializeBody(data, 200);
  return { status: 500, message: `Gateway call to ${target} failed with ${status ?? 'no response'}: ${detail}` };
}

/** Compact description of any axios failure, for log lines. */
export function describeAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return `${error.response.status} ${serializeBody(error.response.data)}`;
    }
    return `${error.code ?? 'no response'}: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
