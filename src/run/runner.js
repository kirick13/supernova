
/* eslint-disable no-await-in-loop */

import { join as joinPath } from 'node:path';
import shlex                from 'shlex';

import * as ARGS                from '../run/args.js';
import { DOCKER_VOLUME_TMP }    from '../run/docker.volume.js';
import * as supernovaConsole    from '../run/logger.js';
import { repos_path_on_host }   from '../run/mounts.js';
import { getRuntimeEnvFilename,
         readRuntimeEnv       } from '../run/runner.env.js';
import checkImageAllowed        from '../run/runner.check-images.js';
import exec                     from '../run/shell.js';
import { isPlainObject,
         replaceVariables }     from '../utils.js';

export const ACCESS_LEVEL = {
	SYSTEM: 2,
	ADMIN: 1,
	EXTERNAL_USER: 0,
};
const ACCESS_LEVEL_VALUES = new Set(Object.values(ACCESS_LEVEL));

const ENV_GIT = {
	GIT_URL: ARGS.git.url,
	GIT_URL_HOSTNAME: ARGS.git.url_hostname,
	GIT_BRANCH: ARGS.git.branch,
	GIT_TOKEN: ARGS.git.token,
};

const ENV_RUNTIME = {};

function environment2CommandArguments(env) {
	const result = [];

	for (const [ key, value ] of Object.entries(env)) {
		result.push(
			'--env',
			`${key}=${value}`,
		);
	}

	return result;
}
function mounts2CommandArguments(mounts) {
	const result = [];

	for (const {
		type = 'bind',
		source,
		target = source,
		readonly = false,
	} of mounts) {
		const flag_readonly = readonly ? ',readonly' : '';

		result.push(
			'--mount',
			`type=${type},source=${source},target=${target}${flag_readonly}`,
		);
	}

	return result;
}

export default async function (steps, access_level) {
	if (ACCESS_LEVEL_VALUES.has(access_level) === false) {
		throw new Error(`Invalid access level: ${access_level}`);
	}

	function getEnvironment() {
		const env = {};

		if (access_level >= ACCESS_LEVEL.SYSTEM) {
			Object.assign(
				env,
				ENV_GIT,
			);
		}

		Object.assign(
			env,
			ARGS.extra_env,
			ENV_RUNTIME,
		);

		return env;
	}

	for (const step of steps) {
		const getDockerImage = () => {
			if (step.image !== null) {
				return step.image;
			}

			if (step.docker !== null) {
				return 'docker:20.10.22-alpine3.17';
			}

			return 'busybox:stable';
		};
		const getMounts = () => {
			const mounts = [];

			mounts.push(
				{
					source: joinPath(
						repos_path_on_host,
						ARGS.name,
					),
					target: '/opt/supernova',
					readonly: access_level < ACCESS_LEVEL.SYSTEM,
				},
				{
					type: 'volume',
					source: DOCKER_VOLUME_TMP,
					target: '/tmp/supernova',
				},
			);

			if (
				isPlainObject(step.docker)
				|| (
					step.docker === true
					&& access_level >= ACCESS_LEVEL.ADMIN
				)
			) {
				mounts.push({
					source: '/var/run/docker.sock',
				});
			}

			return mounts;
		};

		const main_command = [ 'docker' ];
		let step_title;

		const container_commands = [];

		// exec in local container
		if (step.container !== null) { // eslint-disable-line unicorn/no-negated-condition
			if (access_level < ACCESS_LEVEL.ADMIN) {
				throw new Error('You can not execute commands inside local containers.');
			}

			step_title = `[PIPELINE STEP] ${step.name} (container ${step.container})`;

			main_command.push(
				'exec',
				step.container,
				'/bin/sh',
			);
		}
		else {
			const image = getDockerImage();

			step_title = `[PIPELINE STEP] ${step.name} (image ${image})`;

			main_command.push(
				'run',
				'--rm',
				// *[ a for mount in self._get_mounts() for a in ('--mount', mount) ],
				...mounts2CommandArguments(
					getMounts(),
				),
				...environment2CommandArguments(
					getEnvironment(),
				),
				'--workdir',
				'/opt/supernova', // TODO: custom workdir in step
				'--entrypoint',
				'/bin/sh', // TODO: custom entrypoint in step
				image,
			);
		}

		const env_runtime_keys = new Set();

		if (isPlainObject(step.docker)) {
			const container_command_this = [ 'docker' ];

			if (step.docker.build !== null) {
				for (const [ host, { user, token }] of Object.entries(ARGS.docker.login)) {
					container_commands.push(
						shlex.join([
							'docker',
							'login',
							host,
							'--username',
							user,
							'--password',
							token,
						]),
					);
				}

				const {
					file,
					tag,
					platforms,
				} = step.docker.build;

				if (Array.isArray(platforms)) {
					container_commands.push(
						'docker buildx create --name multibuilder >/dev/null 2>&1',
						'docker buildx use multibuilder',
					);

					container_command_this.push(
						'buildx',
						'build',
						'--push',
						'--platform',
						platforms.join(','),
					);
				}
				else {
					container_command_this.push('build');
				}

				if (file !== null) {
					container_command_this.push(
						'--file',
						file,
					);
				}

				// tag
				{
					const tag_to_build = replaceVariables(
						tag,
						ARGS.extra_env,
						ENV_RUNTIME,
					);

					if (
						access_level <= ACCESS_LEVEL.EXTERNAL_USER
						&& ARGS.docker.images_allowed !== null
					) {
						checkImageAllowed(tag_to_build);
					}

					container_command_this.push(
						'--tag',
						tag_to_build,
					);
				}

				container_command_this.push('.');
			}

			container_commands.push(
				shlex.join(container_command_this),
			);
		}
		else {
			if (
				typeof step.docker === 'boolean'
				&& access_level < ACCESS_LEVEL.ADMIN
			) {
				throw new Error('You can not execute arbitrary docker commands.');
			}

			// container_commands.push(step.commands);
			for (const command of step.commands) {
				if (typeof command === 'string') {
					container_commands.push(command);
				}
				else if (isPlainObject(command)) {
					const env_key = Object.keys(command)[0];
					const env_value_command = command[env_key];

					const env_file_name = getRuntimeEnvFilename(env_key);
					env_runtime_keys.add(env_key);

					container_commands.push(
						`(${env_value_command}) > ${env_file_name}`,
						`export ${env_key}=$(cat ${env_file_name})`,
					);
				}
			}
		}

		main_command.push(
			'-c',
			container_commands.join(' && '),
		);

		await supernovaConsole.indent(
			step_title,
			async () => {
				if (process.env.SUPERNOVA_DEBUG) {
					supernovaConsole.log(
						'COMMAND',
						shlex.join(main_command),
					);
				}

				await exec(...main_command);

				for (const env_key of env_runtime_keys) {
					ENV_RUNTIME[env_key] = await readRuntimeEnv(env_key);
				}
			},
		);
	}
}
