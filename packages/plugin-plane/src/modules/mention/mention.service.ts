import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { IMention, IMentionFindInput, IPagination } from '@ever-gauzy/plugin-integration-plane-models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { getMentionsQuery } from '../../config';

@Injectable()
export class MentionService extends ApiFetchService {
	private path = '/mentions';

	async findAll(options: Partial<IMentionFindInput>): Promise<IMention[]> {
		try {
			const query = qs.stringify(getMentionsQuery(options));

			const mentions: IPagination<IMention> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			return mentions.items;
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}
}
