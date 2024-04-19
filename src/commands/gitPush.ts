import { commands, window } from 'vscode';

export const gitPush = commands.registerCommand('jj.gitPush', async () => {
	console.info('hi');
	window.showInformationMessage('run git push');
});
