export interface IServerFetchInputs {
  path: string;
  method: "POST" | "GET" | "PUT" | "DELETE";
  body?: any;
  bearer_token?: string;
  tenantId?: string;
  init?: RequestInit;
  query?: any;
}