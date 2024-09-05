import { Injectable } from '@nestjs/common';
import { ID } from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class HistoryService extends ApiFetchService {
	async getIssueHistory(issueId: ID, query?: string) {
		console.log({ query });
		return [];
	}

	async getIssuePropertyActivity(issueId: ID) {
		console.log(issueId);
		return [];
	}
}
