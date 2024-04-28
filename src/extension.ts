// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Run } from './command';
import path from 'node:path';
import { gitPush } from './commands/gitPush';
import { listBranches } from './commands/listBranches';
import { gitPull } from './commands/gitPull';

function createResourceUri(relativePath: string): vscode.Uri {
	const root = vscode.workspace?.workspaceFolders?.[0];
	if (!root) throw new Error('fucky wucky');

	const absolutePath = path.join(relativePath);
	return vscode.Uri.file(absolutePath);
}

function mapChangeLine(line: string): vscode.SourceControlResourceState {
	const [marker, file] = line.split(' ');
	switch (marker) {
		case 'A':
		case 'M':
			return {
				resourceUri: createResourceUri(file),
				contextValue: 'diffable',
			};
		case 'D':
			return {
				resourceUri: createResourceUri(file),
				decorations: {
					strikeThrough: true,
					iconPath: '',
				},
			};
		default:
			throw new Error('Does not match');
	}
}

export async function activate(context: vscode.ExtensionContext) {
	const jjSourceControl = vscode.scm.createSourceControl('jj', 'Jujutsu');
	const modified = jjSourceControl.createResourceGroup(
		'modified',
		'Modified in commit',
	);
	const root = vscode.workspace?.workspaceFolders?.[0];

	if (!root) return void 0;

	context.subscriptions.push(listBranches, gitPush, gitPull);

	const initialRun = new Run('jj', {
		args: ['st', '--no-pager'],
		cwd: root.uri.fsPath,
	});

	vscode.workspace.onDidDeleteFiles(async () => {
		const b = initialRun.clone();
		const output = await b.output();
		const splitValue = output.split(/\r?\n/);
		modified.resourceStates = [];
		for (const line of splitValue) {
			if (line.startsWith('Working copy') || line.startsWith('Parent commit'))
				continue;
			modified.resourceStates = modified.resourceStates.concat([
				mapChangeLine(line),
			]);
		}
		console.info('hi you');
	});

	vscode.workspace.onDidCreateFiles(async () => {
		const b = initialRun.clone();
		const output = await b.output();
		const splitValue = output.split(/\r?\n/);
		modified.resourceStates = [];
		for (const line of splitValue) {
			if (line.startsWith('Working copy') || line.startsWith('Parent commit'))
				continue;
			modified.resourceStates = modified.resourceStates.concat([
				mapChangeLine(line),
			]);
		}
		console.info('hi you');
	});

	vscode.workspace.onDidSaveTextDocument(async () => {
		console.info('on did save');
		const b = initialRun.clone();
		const splitValue = (await b.output()).split(/\r?\n/);
		modified.resourceStates = [];

		for (const line of splitValue) {
			if (line.startsWith('Working copy') || line.startsWith('Parent commit'))
				continue;

			modified.resourceStates = modified.resourceStates.concat([
				mapChangeLine(line),
			]);
		}
	});

	const runValue = await initialRun.output();
	const splitValue = runValue.split(/\r?\n/);

	for (const line of splitValue) {
		if (line.startsWith('Working copy') || line.startsWith('Parent commit'))
			continue;

		modified.resourceStates = modified.resourceStates.concat([
			mapChangeLine(line),
		]);
	}

	vscode.commands.executeCommand('setContext', 'scmProvider', 'jj');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	return void 0;
}

// This method is called when your extension is deactivated
export function deactivate() {}
