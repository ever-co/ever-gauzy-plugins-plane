export function widgetTargetDateTransformer(dateString: string): {
	dueDateFrom: Date;
	dueDateTo: Date;
} {
	const parts = dateString.split(',');

	const [dueDateFrom, dueDateTo] = parts;

	const dueDate = new Date(dueDateTo.split(';')[0]);
	dueDate.setDate(dueDate.getDate() + 1);

	return {
		dueDateFrom: new Date(dueDateFrom.split(';')[0]),
		dueDateTo: dueDate,
	};
}
