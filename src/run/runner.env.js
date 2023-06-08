
import { DOCKER_VOLUME_TMP } from './docker.volume.js';

export function getRuntimeEnvFilename(env_variable) {
	return `/tmp/supernova/.runtime.${env_variable}.env`;
}

export async function readRuntimeEnv(env_variable) {
	const proc = Bun.spawn([
		'docker',
		'run',
		'--rm',
		'--mount',
		`type=volume,source=${DOCKER_VOLUME_TMP},target=/tmp/supernova,readonly`,
		'busybox:stable',
		'cat',
		getRuntimeEnvFilename(env_variable),
	]);

	// const value = await Bun.readableStreamToString(proc.stdout);
	const value = await new Response(proc.stdout).text();

	return value.trim();
}
