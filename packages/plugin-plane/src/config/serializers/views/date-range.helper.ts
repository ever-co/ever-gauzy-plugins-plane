import moment from 'moment';

// Function to handle relative dates like "1_weeks;after;fromnow" or "2_months;before;fromnow"
function parseRelativeDate(dateString: string): string | null {
	const parts = dateString.split(';');

	if (parts.length < 3 || parts.length > 4) {
		throw new Error(`Invalid format for relative date: ${dateString}`);
	}

	const [valueWithUnit, operator, reference] = parts;

	if (reference !== 'fromnow') {
		throw new Error(`Unsupported date reference: ${reference}`);
	}

	const [value, unit] = valueWithUnit.split('_');
	const amount = parseInt(value);

	const validUnits: moment.unitOfTime.DurationConstructor[] = [
		'days',
		'weeks',
		'months',
		'years',
	];
	if (!validUnits.includes(unit as moment.unitOfTime.DurationConstructor)) {
		throw new Error(`Unsupported time unit: ${unit}`);
	}

	let date = moment();

	if (operator === 'after') {
		date = date.add(amount, unit as moment.unitOfTime.DurationConstructor); // Add time
	} else if (operator === 'before') {
		date = date.subtract(
			amount,
			unit as moment.unitOfTime.DurationConstructor,
		); // Subtract time
	} else {
		throw new Error(`Unsupported operator: ${operator}`);
	}

	return date.format('YYYY-MM-DD'); // Return formatted date
}

// Function to handle specific date formats like "2024-10-09;after"
function parseSpecificDate(dateString: string): string | null {
	const parts = dateString.split(';');

	if (parts.length !== 2) {
		throw new Error(`Invalid format for specific date: ${dateString}`);
	}

	const [datePart, operator] = parts;
	const date = moment(datePart, 'YYYY-MM-DD'); // Parse date in YYYY-MM-DD format

	if (!date.isValid()) {
		throw new Error(`Invalid date: ${datePart}`);
	}

	if (operator === 'after') {
		return date.add(1, 'days').format('YYYY-MM-DD'); // Return day after
	} else if (operator === 'before') {
		return date.subtract(1, 'days').format('YYYY-MM-DD'); // Return day before
	}

	throw new Error(`Unsupported date operator: ${operator}`);
}

// Function to handle custom ranges like "today", "yesterday", "last_7_days", "last_30_days"
function parseCustomDateRange(dateString: string): string | null {
	switch (dateString) {
		case 'today;custom;custom':
			return moment().format('YYYY-MM-DD');
		case 'yesterday;custom;custom':
			return moment().subtract(1, 'days').format('YYYY-MM-DD');
		case 'last_7_days;custom;custom':
			return moment().subtract(7, 'days').format('YYYY-MM-DD');
		case 'last_30_days;custom;custom':
			return moment().subtract(30, 'days').format('YYYY-MM-DD');
		default:
			throw new Error(`Unsupported custom date range: ${dateString}`);
	}
}

// Main function to handle all formats
export function parseFilterDate(dateString: string): string | null {
	if (dateString.includes('fromnow')) {
		return parseRelativeDate(dateString); // Handle relative dates
	}
	if (dateString.includes('custom')) {
		return parseCustomDateRange(dateString); // Handle custom date ranges
	}
	return parseSpecificDate(dateString); // Handle specific dates with before/after
}
