import { Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class WorkspacesService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	async create(data) {}
}
