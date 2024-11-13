import { Injectable } from '@nestjs/common';
import { ID } from '@plane-plugin/models';

@Injectable()
export class DashboardService {
	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------/
	 */
	async updateDashboardWidget(widgetId?: ID, input?: any) {
		console.log({ widgetId, input });
		return { message: 'successfully updated' };
	}
}
