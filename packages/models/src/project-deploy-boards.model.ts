/**
 * The input for creating a project deploy boards
 */
export interface IProjectDeployBoardsCreateInput  {
    is_comments_enabled: boolean;
    is_reactions_enabled: boolean;
    is_votes_enabled: boolean;
    view_props: {
        list: boolean;
        kanban: boolean;
    };
}
