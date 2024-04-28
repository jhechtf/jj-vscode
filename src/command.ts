import {
	spawn,
	exec,
	type ChildProcess,
	type ChildProcessByStdio,
} from 'node:child_process';
import type { Writable, Readable } from 'node:stream';
import { ReadableStream, WritableStream } from 'node:stream/web';

type StdType = 'piped' | 'inherit' | 'null';

export interface CommandArgs {
	args: string[];
	cwd: string | URL;
	env: Record<string, string>;
	stdin: StdType;
	stdout: StdType;
	stderr: StdType;
	signal: AbortSignal;
	splitByLines: boolean;
	controller: AbortController;
}

export class Run {
	private process: ChildProcessByStdio<Writable, Readable, Readable>;
	private done = false;
	private success = false;
	private signal: AbortSignal;
	private controller: AbortController;
	constructor(
		public cmd: string,
		public options: Partial<CommandArgs> = {
			args: [],
			stdin: 'inherit',
			stdout: 'inherit',
			stderr: 'inherit',
			splitByLines: false,
			controller: new AbortController(),
		},
	) {
		if (options.controller) {
			this.controller = options.controller;
			this.signal = this.controller.signal;
		} else {
			// Realistically this code should never be gotten to, but like, y'know.
			this.controller = new AbortController();
			this.signal = this.controller.signal;
		}

		this.process = spawn(cmd, options.args || [], {
			...options,
			signal: this.signal,
		});
	}

	streamOutput() {
		const process = this.process;
		const options = this.options;
		return {
			stdout: new ReadableStream<string>({
				start(controller) {
					process.stdout.on('data', (chk: Buffer) => {
						const str = chk.toString();
						if (options.splitByLines) {
							for (const line of str.split(/\r?\n/)) controller.enqueue(line);
						} else {
							controller.enqueue(str);
						}
					});
					process.on('close', (code) => {
						controller.close();
					});
				},
			}),
			stderr: new ReadableStream({
				start(controller) {
					process.on('close', (code) => {
						controller.close();
					});
					process.stderr.on('data', (chk) => {
						const str = chk.toString();
						if (options.splitByLines) {
							for (const line of str.split(/\r?\n/)) controller.enqueue(line);
						} else {
							controller.enqueue(str);
						}
					});
				},
			}),
		};
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
