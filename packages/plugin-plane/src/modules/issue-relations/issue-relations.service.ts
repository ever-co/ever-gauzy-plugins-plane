import { Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class IssueRelationsService extends ApiFetchService {
	private readonly path = '/task-linked-issue';
}
