import { workspace } from 'vscode';
import type {
	Disposable,
	SourceControl,
	SourceControlResourceGroup,
} from 'vscode';
import { Run } from '../command';
import { getWsRoot } from '../util';
import { createResourceUri } from '../scm';

export class JjRepository implements Disposable {
	#disposables: Disposable[] = [];

	groups: Record<'working', SourceControlResourceGroup>;

	constructor(private sourceControl: SourceControl) {
		this.groups = {
			working: sourceControl.createResourceGroup('working', 'Working'),
		};

		this.#disposables.push(
			workspace.onDidDeleteFiles(this.updateWorkgroups),
			workspace.onDidCreateFiles(this.updateWorkgroups),
			workspace.onDidSaveTextDocument(this.updateWorkgroups),
			workspace.onDidRenameFiles(this.updateWorkgroups),
		);
	}

	async updateWorkgroups() {
		const root = await getWsRoot();
		const command = new Run('jj', {
			args: ['st', '--no-pager'],
			cwd: root.uri.fsPath,
			splitByLines: true,
		});

		this.groups.working.resourceStates = [];

		const { stdout } = command.streamOutput();

		for await (const line of stdout) {
			if (!/[MAD]/.test(line)) continue;
			const [marker, file] = line.split(' ');
			switch (marker) {
				case 'A':
				case 'M':
					this.groups.working.resourceStates =
						this.groups.working.resourceStates.concat({
							resourceUri: createResourceUri(file),
							contextValue: 'diffable',
						});
					break;
				case 'D':
					this.groups.working.resourceStates =
						this.groups.working.resourceStates.concat({
							resourceUri: createResourceUri(file),
							decorations: {
								strikeThrough: true,
							},
						});
			}
		}
	}

	dispose() {
		for (let i = 0; i < this.#disposables.length; i++) {
			this.#disposables[i].dispose();
		}
	}

	[Symbol.dispose]() {
		for (let i = 0; i < this.#disposables.length; i++) {
			this.#disposables[i].dispose();
		}
	}
}
