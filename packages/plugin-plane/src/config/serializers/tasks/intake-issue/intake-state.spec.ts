/// <reference types="jest" />
// uuid 14 ships ESM only, which jest's CommonJS runtime cannot load (Node itself can)
jest.mock('uuid', () => ({ v4: () => '00000000-0000-4000-8000-000000000000' }));
import { ScreeningTaskStatusEnum } from '@ever-gauzy/plugin-integration-plane-models';
import {
	intakeIssueTranformer,
	intakeStateId,
	intakeStateTransformer
} from './intake-issue.serializer';

describe('intake "Triage" state', () => {
	const task = {
		id: 't1',
		title: 'T',
		projectId: 'p1',
		taskStatusId: 'backlog-status'
	} as any;

	it("is a stable per-project state in Plane's triage group", () => {
		expect(intakeStateTransformer('p1')).toMatchObject({
			id: intakeStateId('p1'),
			name: 'Triage',
			group: 'triage',
			project_id: 'p1'
		});
		expect(intakeStateId('p1')).not.toBe(intakeStateId('p2'));
	});

	it('shows pending and snoozed screening tasks in the triage state', () => {
		for (const status of [
			ScreeningTaskStatusEnum.PENDING,
			ScreeningTaskStatusEnum.SNOOZED
		]) {
			const item = intakeIssueTranformer({
				id: 's1',
				status,
				task
			} as any) as any;
			expect(item.issue.state_id).toBe(intakeStateId('p1'));
			expect(item.issue.state__group).toBe('triage');
		}
	});

	it('shows triaged screening tasks in their real task status', () => {
		for (const status of [
			ScreeningTaskStatusEnum.ACCEPTED,
			ScreeningTaskStatusEnum.DECLINED,
			ScreeningTaskStatusEnum.DUPLICATED
		]) {
			const item = intakeIssueTranformer({
				id: 's1',
				status,
				task
			} as any) as any;
			expect(item.issue.state_id).toBe('backlog-status');
		}
	});
});
