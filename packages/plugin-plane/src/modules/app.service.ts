import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { data: any[]; count: number } {
    return { data: [{ name: 'Fisrst user', password: '123456' }], count: 0 };
  }
}
