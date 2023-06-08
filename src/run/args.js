
export const name = process.env.SUPERNOVA_NAME;
export const name_hash = Bun.hash(name).toString(16);
export const display_name = process.env.SUPERNOVA_DISPLAY_NAME ?? name;

export const git = {
	url: process.env.SUPERNOVA_GIT_URL,
	url_hostname: new URL(process.env.SUPERNOVA_GIT_URL).hostname,
	branch: process.env.SUPERNOVA_GIT_BRANCH,
	token: process.env.SUPERNOVA_GIT_TOKEN ?? null,
};

export const extra_env = JSON.parse(process.env.SUPERNOVA_ENV_EXTRA ?? '{}');

export const docker = {
	images_allowed: process.env.SUPERNOVA_DOCKER_IMAGES_ALLOWED
		? new Set(JSON.parse(process.env.SUPERNOVA_DOCKER_IMAGES_ALLOWED))
		: null,
	login: JSON.parse(process.env.SUPERNOVA_DOCKER_LOGIN ?? 'null'),
};

export const steps = JSON.parse(
	atob(process.env.SUPERNOVA_STEPS),
);

export const notifiers = JSON.parse(process.env.SUPERNOVA_NOTIFIERS ?? '[]');
