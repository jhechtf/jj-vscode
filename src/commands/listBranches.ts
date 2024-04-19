import { commands } from 'vscode';

export const listBranches = commands.registerCommand(
	'jj.listBranches',
	async () => {
		console.info('hello from list branches');
	},
);
