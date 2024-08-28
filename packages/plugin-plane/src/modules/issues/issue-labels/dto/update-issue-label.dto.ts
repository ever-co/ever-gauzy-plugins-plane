import { PartialType } from '@nestjs/swagger';
import { CreateIssueLabelDTO } from '.';
import { IUpdateIssueLabelInput } from '@plane-plugin/models';

export class UpdateIssueLabelDTO
	extends PartialType(CreateIssueLabelDTO)
	implements IUpdateIssueLabelInput {}
