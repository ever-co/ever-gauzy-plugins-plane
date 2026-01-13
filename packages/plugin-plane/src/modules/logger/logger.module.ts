import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Global Logger Module
 * Provides a centralized logging service across the application
 */
@Global()
@Module({
	providers: [LoggerService],
	exports: [LoggerService]
})
export class LoggerModule {}
