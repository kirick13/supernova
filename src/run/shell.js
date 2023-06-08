
import { writeOut,
         writeError }    from '../run/logger.js';
import { isPlainObject } from '../utils.js';

export class SubprocessError extends Error {
	constructor(exit_code) {
		super(`Subprocess exited with error code ${exit_code}.`);

		this.exit_code = exit_code;
	}
}

export default async function (...args) {
	const {
		ignore_error = false,
	} = isPlainObject(args.at(-1)) ? args.pop() : {};

	const proc = Bun.spawn(
		args,
		{
			env: {},
			stdout: 'pipe',
			stderr: 'pipe',
		},
	);

	for await (const chunk of proc.stdout) {
		writeOut(chunk);
	}
	for await (const chunk of proc.stderr) {
		writeError(chunk);
	}

	await proc.exited;

	if (
		proc.exitCode !== 0
		&& !ignore_error
	) {
		throw new SubprocessError(proc.exitCode);
	}
}
