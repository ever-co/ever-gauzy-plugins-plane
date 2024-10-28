import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivityService {
	findAll() {
		return `This action returns all activity`;
	}
}
