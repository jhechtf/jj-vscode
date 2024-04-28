import {
	workspace,
	window,
	type QuickPickItem,
	type WorkspaceFolder,
} from 'vscode';

interface WsQuickPick extends QuickPickItem {
	folder: WorkspaceFolder;
}

/**
 * @description Gets the workspace root, or shows a picker to determine it
 */
export async function getWsRoot(): Promise<WorkspaceFolder> {
	if (!workspace.workspaceFolders) throw new Error('nope');

	if (workspace.workspaceFolders.length === 1)
		return workspace.workspaceFolders[0];

	const selection = await window.showQuickPick(
		workspace.workspaceFolders.map((wf) => {
			return {
				label: wf.name,
				description: wf.uri.fsPath,
				folder: wf,
			} as WsQuickPick;
		}),
		{
			title:
				'You have multiple workspaces, please choose one to run this command',
			matchOnDescription: true,
		},
	);

	if (selection === undefined) return workspace.workspaceFolders[0];

	return selection.folder;
}
