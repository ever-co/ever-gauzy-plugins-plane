import { PartialType } from '@nestjs/swagger';
import { CreateIssueLabelDTO } from '.';
import { IUpdateIssueLabelInput } from '@ever-gauzy/plugin-integration-plane-models';

export class UpdateIssueLabelDTO
	extends PartialType(CreateIssueLabelDTO)
	implements IUpdateIssueLabelInput {}
