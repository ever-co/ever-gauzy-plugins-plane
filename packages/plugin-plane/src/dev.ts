import { Logger } from '@nestjs/common';
import { bootstrap } from './main';
import { PlaneConfigRegistry } from './plane-config.registry';

const logger = new Logger('Bootstrap');

bootstrap().then(() => {
	logger.log(`API Running and listening to ${PlaneConfigRegistry.externalBaseApiUrl}`);
});
