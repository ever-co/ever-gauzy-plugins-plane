import { PartialType } from '@nestjs/swagger';
import { ICreateModuleInput } from '@ever-gauzy/plugin-integration-plane-models';
import { CreateModuleDTO } from './create-module.dto';

export class UpdateModuleDTO
	extends PartialType(CreateModuleDTO)
	implements Partial<ICreateModuleInput> {}
