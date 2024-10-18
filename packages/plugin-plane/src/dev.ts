import { bootstrap } from './main';
import { EXTERNAL_BASE_API_URL } from './config';

bootstrap().then(() => {
	console.log(`API Running and listen to ${EXTERNAL_BASE_API_URL()}`);
});
