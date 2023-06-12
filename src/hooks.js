
import { join as joinPath } from 'node:path';

import { readConfig,
         readProject,
         createProjectDirectory,
         replaceVariables      } from './utils.js';

const config = await readConfig('/etc/supernova/config.yml');

for (const notifier of Object.values(config.notifications)) {
	notifier.chat_id = replaceVariables(notifier.chat_id, process.env);
	notifier.bot_token = replaceVariables(notifier.bot_token, process.env);
}

const hooks = new Map();
export default hooks;

const promises = [];

for (const project_name of Object.keys(config.projects)) {
	promises.push(
		createProjectDirectory(project_name),
	);

	let project = config.projects[project_name];
	if (typeof project === 'string') {
		const config_path = joinPath(
			'/etc/supernova',
			project,
		);

		// eslint-disable-next-line no-await-in-loop
		project = await readProject(config_path);
	}

	const project_repo = project.repo;

	const hook = {
		name: project_name,
		secret: replaceVariables(project.webhookSecret, process.env),
		env: {
			SUPERNOVA_NAME: project_name,
			SUPERNOVA_DISPLAY_NAME: project.displayName,
			SUPERNOVA_GIT_URL: project_repo.url,
			SUPERNOVA_GIT_BRANCH: project_repo.branch,
			SUPERNOVA_ENV_EXTRA: JSON.stringify(project.env),
			SUPERNOVA_STEPS: btoa(
				JSON.stringify(project.steps),
			),
		},
	};

	if (project.docker.imagesAllowed !== null) {
		hook.env.SUPERNOVA_DOCKER_IMAGES_ALLOWED = JSON.stringify(project.docker.imagesAllowed);
	}

	{ // eslint-disable-line no-lone-blocks
		for (const docker_login of Object.values(project.docker.login)) {
			docker_login.token = replaceVariables(docker_login.token, process.env);
		}

		hook.env.SUPERNOVA_DOCKER_LOGIN = JSON.stringify(project.docker.login);
	}

	{
		const notifiers = [];
		for (const notifier_name of project.notify) {
			const notifier = config.notifications[notifier_name];
			if (notifier === undefined) {
				throw new Error(`Notifier "${notifier_name}" is not defined.`);
			}

			notifiers.push(notifier);
		}

		hook.env.SUPERNOVA_NOTIFIERS = JSON.stringify(notifiers);
	}

	if (project_repo.token !== null) {
		const repo_user = replaceVariables(project_repo.user, process.env);
		const repo_token = replaceVariables(project_repo.token, process.env);

		hook.env.SUPERNOVA_GIT_TOKEN = `${repo_user}:${repo_token}`;
	}

	hooks.set(
		`/webhook/${project_name}`,
		hook,
	);
}

await Promise.all(promises);
