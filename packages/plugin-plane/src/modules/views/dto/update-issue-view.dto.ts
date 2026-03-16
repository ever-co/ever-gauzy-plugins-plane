import { PartialType } from '@nestjs/swagger';
import { IUpdateViewInput } from '@ever-gauzy/plugin-integration-plane-models';
import { CreateViewDTO } from './create-issue-view.dto';

export class UpdateViewDTO
	extends PartialType(CreateViewDTO)
	implements IUpdateViewInput {}
