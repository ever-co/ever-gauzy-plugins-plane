import moment from 'moment';

// Function to handle relative dates like "1_weeks;after;fromnow"
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
	const validUnits = ['days', 'weeks', 'months', 'years'];
	if (!validUnits.includes(unit as moment.unitOfTime.DurationConstructor)) {
		throw new Error(`Unsupported time unit: ${unit}`);
	}

	let date = moment();

	if (operator === 'after') {
		date = date.add(amount, unit as moment.unitOfTime.DurationConstructor); // Add the time
	} else if (operator === 'before') {
		date = date.subtract(
			amount,
			unit as moment.unitOfTime.DurationConstructor,
		); // Subtract the time
	} else {
		throw new Error(`Unsupported operator: ${operator}`);
	}

	return date.format('YYYY-MM-DD'); // Return only the date
}

// Function to handle specific date formats like "2024-10-09;after"
export function parseDateFilter(dateString: string): string | null {
	const parts = dateString.split(';');

	if (parts.length !== 2) {
		throw new Error(`Invalid format for specific date: ${dateString}`);
	}

	const [datePart, operator] = parts;
	const date = moment(datePart, 'YYYY-MM-DD'); // Parse the date in YYYY-MM-DD format

	if (!date.isValid()) {
		throw new Error(`Invalid date: ${datePart}`);
	}

	if (operator === 'after') {
		return date.add(1, 'days').format('YYYY-MM-DD'); // Return the day after
	} else if (operator === 'before') {
		return date.subtract(1, 'days').format('YYYY-MM-DD'); // Return the day before
	}

	throw new Error(`Unsupported date operator: ${operator}`);
}

// Main function to handle both formats
export function parseFilterDate(dateString: string): string | null {
	if (dateString.includes('fromnow')) {
		return parseRelativeDate(dateString);
	}

	return parseDateFilter(dateString);
}
