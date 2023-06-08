
import { transform,
         increateIndentation,
         decreaseIndentation } from './logger.transformer.js';
import * as loggerFile         from './logger.file.js';

function consoleArgumentsToChunk(args, write) {
	for (const [ argument_index, argument ] of args.entries()) {
		if (argument_index > 0) {
			write(' ');
		}

		write(
			Bun.inspect(argument),
		);
	}

	write('\n');
}

export function log(...args) {
	consoleArgumentsToChunk(args, writeOut);
}

export function error(...args) {
	consoleArgumentsToChunk(args, writeError);
}

export function writeOut(chunk) {
	transform(chunk, (chunk) => {
		loggerFile.write(chunk);
		process.stdout.write(chunk);
	});
}
export function writeError(chunk) {
	transform(chunk, (chunk) => {
		loggerFile.write(chunk);
		process.stderr.write(chunk);
	});
}

export async function indent(message, fn) {
	log(message);

	increateIndentation();

	await fn();

	decreaseIndentation();
}
