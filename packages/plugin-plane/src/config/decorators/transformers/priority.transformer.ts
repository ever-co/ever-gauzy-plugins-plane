import { Transform } from 'class-transformer';

export function NonePriorityToUndefined() {
	return Transform(({ value }) => {
		if (value === 'none') return undefined;
		return value;
	});
}
