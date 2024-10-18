export const CLIENT_BASE_URL =
	process.env.CLIENT_BASE_URL ?? 'http://localhost';

export const EXTERNAL_API_MODE = () => process.env.EXECUTION_MODE;

// External API base URL
export const EXTERNAL_BASE_API_URL = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.EXTERNAL_BASE_LOCAL_API_URL
		: process.env.EXTERNAL_BASE_API_URL;
