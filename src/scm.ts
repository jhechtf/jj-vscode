import { Uri, workspace } from 'vscode';
import path from 'node:path';

export function createResourceUri(relativePath: string): Uri {
	const root = workspace?.workspaceFolders?.[0];
	if (!root) throw new Error('fucky wucky');

	const absolutePath = path.join(relativePath);
	return Uri.file(absolutePath);
}
