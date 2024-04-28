import { commands } from 'vscode';
import { Run } from '../command';
import { getWsRoot } from '../util';

export const jjMoveToBranch = commands.registerCommand(
	'jj.moveToBranch',
	async () => {
		const root = await getWsRoot();
		const jjBranches = new Run('jj', {
			cwd: root.uri.fsPath,
			args: ['branch', 'list'],
		});
		const raw = await jjBranches.output();
		const split = raw.split(/\r?\n/);
		for (const line of split) {
			console.info(line);
		}
	},
);
