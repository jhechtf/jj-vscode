import {
	type Event,
	type TreeDataProvider,
	TreeView,
	commands,
	window,
	workspace,
	TreeItem,
	EventEmitter,
	TreeItemCollapsibleState,
	type ExtensionContext,
} from 'vscode';
import { gitPull } from './commands/gitPull';
import { gitPush } from './commands/gitPush';
// import { listBranches } from './commands/listBranches';
import { jjMoveToBranch } from './commands/moveToBranch';
import { JjRepository } from './repository/repository';
import { sourceControl } from './repository/sourceControl';
import path from 'node:path';
import fs from 'node:fs';
import { Run } from './command';

class Branch extends TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}
}

export class BranchesProvider implements TreeDataProvider<Branch> {
	constructor(private workspaceRoot: string) {}

	private _onDidChangeTreeData: EventEmitter<Branch | undefined | null | void> =
		new EventEmitter<Branch | undefined | null | void>();
	readonly onDidChangeTreeData: Event<Branch | undefined | null | void> =
		this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Branch): TreeItem {
		return element;
	}

	async getChildren(element?: Branch): Promise<Branch[]> {
		if (!this.workspaceRoot) {
			window.showInformationMessage(
				'No Jujutsu information available - No workspace given',
			);
			return Promise.resolve([]);
		}
		if (element) console.info(element);
		else {
			const branchCommand = new Run('jj', {
				args: ['branch', 'list'],
				cwd: this.workspaceRoot,
				splitByLines: true,
			});

			const { stdout } = branchCommand.streamOutput();

			const out: Branch[] = [];

			for await (const line of stdout) {
				const [branch, revision, gitCommit] = line.split(' ');
				out.push(
					new Branch(
						branch.slice(0, -1),
						revision,
						TreeItemCollapsibleState.None,
					),
				);
			}
			return out;
		}
		return Promise.resolve([]);
	}

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	private getDepsInPackageJson(packageJsonPath: string): Branch[] {
		if (this.pathExists(packageJsonPath)) {
			const toDep = (moduleName: string, version: string): Branch => {
				if (
					this.pathExists(
						path.join(this.workspaceRoot, 'node_modules', moduleName),
					)
				) {
					return new Branch(
						moduleName,
						version,
						TreeItemCollapsibleState.Collapsed,
					);
				} else {
					return new Branch(moduleName, version, TreeItemCollapsibleState.None);
				}
			};

			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

			const deps = packageJson.dependencies
				? Object.keys(packageJson.dependencies).map((dep) =>
						toDep(dep, packageJson.dependencies[dep]),
					)
				: [];
			const devDeps = packageJson.devDependencies
				? Object.keys(packageJson.devDependencies).map((dep) =>
						toDep(dep, packageJson.devDependencies[dep]),
					)
				: [];
			return deps.concat(devDeps);
		} else {
			return [];
		}
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
			return true;
		} catch (err) {
			return false;
		}
	}
}

export async function activate(context: ExtensionContext) {
	const repository = new JjRepository(sourceControl);
	// Initial population of the working groups
	await repository.updateWorkgroups();
	// Set the context of the SCM Provider
	commands.executeCommand('setContext', 'scmProvider', 'jj');

	const rootPath =
		workspace.workspaceFolders && workspace.workspaceFolders.length > 0
			? workspace.workspaceFolders[0].uri.fsPath
			: undefined;
	if (rootPath === undefined) {
		console.error('why is this undefined');
		return;
	}
	const ndp = new BranchesProvider(rootPath);
	context.subscriptions.push(
		window.registerTreeDataProvider('jj.views.branches', ndp),
		commands.registerCommand('jj.refreshBranches', () => ndp.refresh()),
	);

	// The repo implements the Disposable trait, so we just append it to the subscriptions.
	// Part of its disposal process is disposing of anything it was responsible for
	// enqueueing
	context.subscriptions.push(repository);

	context.subscriptions.push(gitPush, gitPull, jjMoveToBranch);
}

// This method is called when your extension is deactivated
export function deactivate() {}
