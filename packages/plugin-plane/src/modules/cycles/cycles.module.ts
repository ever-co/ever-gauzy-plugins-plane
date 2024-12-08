import { forwardRef, Module } from '@nestjs/common';
import { UserFavoritesModule } from '../user-favorites/user-favorites.module';
import { CyclesService } from './cycles.service';
import { CyclesController } from './cycles.controller';
import { ProjectModule } from '../project/project.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
	imports: [
		IssuesModule,
		forwardRef(() => UserFavoritesModule),
		forwardRef(() => ProjectModule)
	],
	providers: [CyclesService],
	controllers: [CyclesController],
	exports: [CyclesService]
})
export class CyclesModule {}
