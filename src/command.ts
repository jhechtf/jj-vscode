import {
	spawn,
	exec,
	type ChildProcess,
	type ChildProcessByStdio,
} from 'node:child_process';
import type { Writable, Readable } from 'node:stream';
type StdType = 'piped' | 'inherit' | 'null';

export interface CommandArgs {
	args: string[];
	cwd: string | URL;
	env: Record<string, string>;
	stdin: StdType;
	stdout: StdType;
	stderr: StdType;
	signal: AbortSignal;
}

export class Run {
	private process: ChildProcessByStdio<Writable, Readable, Readable>;
	private done = false;
	private success = false;
	private signal: AbortSignal;
	constructor(
		public cmd: string,
		public options: Partial<CommandArgs> = {
			args: [],
			stdin: 'inherit',
			stdout: 'inherit',
			stderr: 'inherit',
		},
	) {
		const { signal } = new AbortController();
		this.signal = signal;
		this.process = spawn(cmd, options.args || [], {
			...options,
			signal,
		});
	}

	output(): Promise<string> {
		return new Promise((res, rej) => {
			let data = '';
			let err = '';

			this.process.stdout.on('data', (chunk) => {
				data += chunk.toString();
			});

			this.process.stderr.on('data', (chunk) => {
				err += chunk.toString();
			});

			this.process.on('exit', (code) => {
				console.info('EXIT CODE', code);
				if (code !== 0) {
					return rej(err || code);
				}
				res(data);
			});
		});
	}

	/**
	 *
	 * @returns a new instance of the Run class with the same arguments
	 */
	clone() {
		return new Run(this.cmd, this.options);
	}

	/**
	 * @description likely this method won't be needed but we will see
	 * @param options
	 * @returns a new Run instance with some updates to the options given for the current instance
	 */
	cloneWith(options?: Partial<CommandArgs>) {
		return new Run(this.cmd, Object.assign(this.options, options || {}));
	}
}
