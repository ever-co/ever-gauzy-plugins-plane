import {
	Injectable,
	LoggerService as NestLoggerService,
	Logger
} from '@nestjs/common';

/**
 * Centralized Logger Service for the application
 * Wraps NestJS Logger with additional functionality
 */
@Injectable()
export class LoggerService implements NestLoggerService {
	private readonly logger = new Logger();

	/**
	 * Create a contextualized logger for a specific class/module
	 * @param context - The context name (usually the class name)
	 * @returns A new Logger instance with the specified context
	 */
	forContext(context: string): Logger {
		return new Logger(context);
	}

	/**
	 * Log a message at the 'log' level
	 */
	log(message: any, context?: string): void {
		this.logger.log(message, context);
	}

	/**
	 * Log a message at the 'error' level
	 */
	error(message: any, trace?: string, context?: string): void {
		this.logger.error(message, trace, context);
	}

	/**
	 * Log a message at the 'warn' level
	 */
	warn(message: any, context?: string): void {
		this.logger.warn(message, context);
	}

	/**
	 * Log a message at the 'debug' level
	 */
	debug(message: any, context?: string): void {
		this.logger.debug(message, context);
	}

	/**
	 * Log a message at the 'verbose' level
	 */
	verbose(message: any, context?: string): void {
		this.logger.verbose(message, context);
	}

	/**
	 * Log an API error with structured information
	 * @param error - The error object
	 * @param context - The context where the error occurred
	 * @param operation - The operation that failed
	 */
	logApiError(error: any, context: string, operation: string): void {
		const errorMessage =
			error?.response?.data?.message || error?.message || 'Unknown error';
		const statusCode = error?.response?.status || 'N/A';

		this.logger.error(
			`[${operation}] Failed with status ${statusCode}: ${errorMessage}`,
			error?.stack,
			context
		);
	}

	/**
	 * Log a warning for a failed operation that was handled gracefully
	 * @param message - The warning message
	 * @param context - The context where the warning occurred
	 */
	logWarning(message: string, context: string): void {
		this.logger.warn(message, context);
	}

	/**
	 * Helper to extract error message from various error types
	 * @param error - The error object
	 * @returns Formatted error message string
	 */
	static getErrorMessage(error: any): string {
		return (
			error?.response?.data?.message || error?.message || 'Unknown error'
		);
	}

	/**
	 * Helper to get error stack trace
	 * @param error - The error object
	 * @returns Stack trace string or error string representation
	 */
	static getErrorStack(error: any): string {
		return error instanceof Error ? error.stack : String(error);
	}
}
