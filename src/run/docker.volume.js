
import * as ARGS             from './args.js';
import * as supernovaConsole from './logger.js';
import exec                  from './shell.js';

export const DOCKER_VOLUME_TMP = `supernova-${ARGS.name_hash}`;

export async function create() {
	await supernovaConsole.indent(
		'[INIT] Create docker volumes',
		async () => {
			await exec(
				'docker',
				'volume',
				'create',
				DOCKER_VOLUME_TMP,
				{
					ignore_error: true,
				},
			);
		},
	);
}

export async function remove() {
	await supernovaConsole.indent(
		'[CLEANUP] Remove temporary docker volume',
		async () => {
			await exec(
				'docker',
				'volume',
				'rm',
				DOCKER_VOLUME_TMP,
			);
		},
	);
}
