export interface IServerFetchInputs {
	path: string;
	method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH';
	body?: any;
	bearer_token?: string;
	tenantId?: string;
	init?: RequestInit;
	query?: any;
	customHeaders?: Record<string, any>;
	responseType?: 'arraybuffer' | 'json' | 'text' | 'stream';
}

export interface IApiResponse {
	status: number;
	data: any;
	headers: Record<string, string>;
}
