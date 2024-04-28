import { commands } from 'vscode';
import { Run } from '../command';
import { getWsRoot } from '../util';

export const listBranches = commands.registerCommand(
	'jj.listBranches',
	async () => {
		const root = await getWsRoot();

		const runBraches = new Run('jj', {
			args: ['branch', 'list'],
			cwd: root.uri.fsPath,
		});

		const output = await runBraches.output();

		for (const line of output.split(/\r?\n/)) {
			console.info(line);
		}
	},
);
