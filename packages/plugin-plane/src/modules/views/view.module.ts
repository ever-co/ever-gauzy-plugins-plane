import { forwardRef, Module } from '@nestjs/common';
import { UserFavoritesModule } from '../user-favorites/user-favorites.module';
import { IssueViewService } from './view.service';
import { IssueViewController } from './view.controller';

@Module({
	imports: [forwardRef(() => UserFavoritesModule)],
	providers: [IssueViewService],
	controllers: [IssueViewController],
	exports: [IssueViewService]
})
export class IssueViewModule {}
