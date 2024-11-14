export function widgetTargetDateTransformer(dateString: string): {
	dueDateFrom: Date;
	dueDateTo: Date;
} {
	const parts = dateString.split(',');

	const [dueDateFrom, dueDateTo] = parts;

	return {
		dueDateFrom: new Date(dueDateFrom.split(';')[0]),
		dueDateTo: new Date(dueDateTo.split(';')[0]),
	};
}
