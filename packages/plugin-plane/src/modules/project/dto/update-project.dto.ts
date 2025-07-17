import { PartialType } from '@nestjs/swagger';
import { CreateProjectDTO } from './create-project.dto';
import { IUpdateProjectInput } from '@plane-plugin/models';

export class UpdateProjectDTO
	extends PartialType(CreateProjectDTO)
	implements IUpdateProjectInput {}
