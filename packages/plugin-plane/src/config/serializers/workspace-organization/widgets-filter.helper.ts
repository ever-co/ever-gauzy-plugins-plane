import moment from 'moment';

export function widgetTargetDateTransformer(dateString: string): {
	dueDateFrom: moment.Moment;
	dueDateTo: moment.Moment;
} {
	const parts = dateString.split(',');

	const [dueDateFrom, dueDateTo] = parts;

	return {
		dueDateFrom: moment(dueDateFrom, 'YYYY-MM-DD'),
		dueDateTo: moment(dueDateTo, 'YYYY-MM-DD'),
	};
}
