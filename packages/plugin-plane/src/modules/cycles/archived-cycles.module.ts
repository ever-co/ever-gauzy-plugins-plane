import { Module, forwardRef } from '@nestjs/common';
import { CyclesModule } from './cycles.module';
import { ArchivedCyclesController } from './archived-cycles.controller';

@Module({
	imports: [forwardRef(() => CyclesModule)],
	controllers: [ArchivedCyclesController]
})
export class ArchivedCyclesModule {}
