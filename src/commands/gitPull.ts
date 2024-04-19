import { commands } from 'vscode';

export const gitPull = commands.registerCommand('jj.gitPull', async () => {
	console.info('Git Pull');
});
