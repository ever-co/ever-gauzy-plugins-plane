export const CLIENT_BASE_URL =
	process.env.CLIENT_BASE_URL ?? 'http://localhost';

export const EXTERNAL_API_MODE = () => process.env.EXECUTION_MODE;

// External API base URL
export const EXTERNAL_BASE_API_URL = () =>
	process.env.EXTERNAL_BASE_API_URL || 'https://api.gauzy.co/api';
