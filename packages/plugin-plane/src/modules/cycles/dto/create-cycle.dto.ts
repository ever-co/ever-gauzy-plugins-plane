import { OmitType } from '@nestjs/swagger';
import { CycleDTO } from './cycle.dto';
import { ICycle } from '@ever-gauzy/plugin-integration-plane-models';

export class CreateCycleDTO
	extends OmitType(CycleDTO, ['id'])
	implements Omit<ICycle, 'id'> {}
