import { commands, window } from 'vscode';
import { getWsRoot } from '../util';
import { Run } from '../command';

export const createBranch = commands.registerCommand(
	'jj.createBranch',
	async () => {
		const root = await getWsRoot();

		const newBranchName = await window.showInputBox();

		if (newBranchName === undefined) return;

		const comm = new Run('jj', {
			args: ['branch', 'new', newBranchName],
			cwd: root.uri.fsPath,
			splitByLines: true,
		});

		const { stdout, stderr } = comm.streamOutput();
		for await (const b of stdout) {
			console.info('B', b);
		}
	},
);
