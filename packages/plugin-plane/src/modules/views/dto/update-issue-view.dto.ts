import { PartialType } from '@nestjs/swagger';
import { IUpdateViewInput } from '@plane-plugin/models';
import { CreateViewDTO } from './create-issue-view.dto';

export class UpdateViewDTO
	extends PartialType(CreateViewDTO)
	implements IUpdateViewInput {}
