export interface IState {
	id?: string;
	project_id?: string;
	workspace_id?: string;
	name?: string;
	color?: string;
	group?: string; // Equals to external API Standard Statuses
	default?: boolean; // Can be addes to external API
	description?: string;
	sequence?: number; // Search for its usecase and can be add to external API
}
