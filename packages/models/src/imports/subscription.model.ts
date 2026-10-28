import { IBasePerEntityType, IBasePerTenantAndOrganizationEntityModel, ID } from './base-entity.model';
import { IEmployee } from './employee.model';
import { IUser } from './user.model';

export interface ISubscription extends IBasePerTenantAndOrganizationEntityModel, IBasePerEntityType {
	type: SubscriptionTypeEnum;
	/** The subscribed employee. Gauzy's `EntitySubscription` has no `userId`; it belongs to an employee. */
	employeeId?: ID;
	employee?: IEmployee;
	/** @deprecated Gauzy refuses a `userId` filter on subscriptions; use `employeeId`. */
	userId?: ID;
	user?: IUser;
}

export enum SubscriptionTypeEnum {
	MANUAL = 'manual',
	MENTION = 'mention',
	ASSIGNMENT = 'assignment',
	COMMENT = 'comment',
	CREATED_ENTITY = 'created-entity'
}

export interface ISubscriptionCreateInput
	extends Omit<ISubscription, 'user' | 'userId' | 'employee'>,
		Partial<Pick<ISubscription, 'employeeId'>> {}

export interface ISubscriptionFindInput extends Partial<ISubscription> {}
