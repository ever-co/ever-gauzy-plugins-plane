import { Logger } from '@nestjs/common';
import { bootstrap } from './main';
import { EXTERNAL_BASE_API_URL } from './config';

const logger = new Logger('Bootstrap');

bootstrap().then(() => {
	logger.log(`API Running and listening to ${EXTERNAL_BASE_API_URL()}`);
});
