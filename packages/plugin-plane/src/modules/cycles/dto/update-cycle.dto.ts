import { PartialType } from '@nestjs/swagger';
import { CreateCycleDTO } from './create-cycle.dto';
import { ICycle } from '@ever-gauzy/plugin-integration-plane-models';

export class UpdateCycleDTO
	extends PartialType(CreateCycleDTO)
	implements Partial<Omit<ICycle, 'id'>> {}
