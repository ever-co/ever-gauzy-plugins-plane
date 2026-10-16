import { Module } from '@nestjs/common';
import { EstimatesModule } from './estimates.module';
import { WorkspaceEstimatesController } from './workspace-estimates.controller';

/**
 * Separate from EstimatesModule, which is mounted under `/projects/:projectId/estimates`.
 */
@Module({
	imports: [EstimatesModule],
	controllers: [WorkspaceEstimatesController]
})
export class WorkspaceEstimatesModule {}
