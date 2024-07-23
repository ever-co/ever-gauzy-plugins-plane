import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { data: any[]; count: number } {
    return { data: [], count: 0 };
  }
}
