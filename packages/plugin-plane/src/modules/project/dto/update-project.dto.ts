import { PartialType } from '@nestjs/swagger';
import { CreateProjectDTO } from './create-project.dto';
import { IUpdateProjectInput } from '@ever-gauzy/plugin-integration-plane-models';

export class UpdateProjectDTO
	extends PartialType(CreateProjectDTO)
	implements IUpdateProjectInput {}
