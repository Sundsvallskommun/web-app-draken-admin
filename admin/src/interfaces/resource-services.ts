import { RequestParams } from '@config/http-client';

export type ID = string | number;
export type GetOne<TResponse> = (municipalityId: number, id: number, params?: RequestParams) => TResponse;
export type GetMany<TResponse, TFilter = undefined> =
  (municipalityId: number, filter?: TFilter) => TResponse;
export type Create<TData, TResponse> = (municipalityId: number, data: TData, params?: RequestParams) => TResponse;
export type Update<TData, TResponse> = (municipalityId: number, id: number, data: TData, params?: RequestParams) => TResponse;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Remove<T = any> = (municipalityId: number, id: number, params?: RequestParams) => T;