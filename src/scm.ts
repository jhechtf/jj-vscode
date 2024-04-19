import { Uri, workspace } from 'vscode';
import type { Disposable } from 'vscode';

export function createResourceUri(relativePath: string): Uri {
	if (workspace.workspaceFolders && workspace.workspaceFolders.length === 1) {
		const base = workspace.workspaceFolders[0];
		return Uri.joinPath(base.uri, relativePath);
	}
	throw new Error('Nope');
}

export class JjScm implements Disposable {
	constructor(public readonly cwd: string) {}
	dispose() {
		// IDK yet;
	}
}
