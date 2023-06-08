
import { mkdir } from 'node:fs/promises';

import { readConfig,
         replaceVariables } from './utils.js';

async function createProjectDirectory(project_name) {
	try {
		await mkdir(
			'/var/supernova/repos/' + project_name,
			{ recursive: true },
		);
	}
	catch (error) {
		if (error.code !== 'EEXIST') {
			throw error;
		}
	}
}

const config = await readConfig('/etc/supernova/config.yml');

for (const notifier of Object.values(config.notifications)) {
	notifier.chat_id = replaceVariables(notifier.chat_id, process.env);
	notifier.bot_token = replaceVariables(notifier.bot_token, process.env);
}

const hooks = [];

for (const [ project_name, project ] of Object.entries(config.projects)) {
	await createProjectDirectory(project_name); // eslint-disable-line no-await-in-loop

	const project_repo = project.repo;

	const hook_env = [
		{
			envname: 'SUPERNOVA_NAME',
			source: 'string',
			name: project_name,
		},
		{
			envname: 'SUPERNOVA_DISPLAY_NAME',
			source: 'string',
			name: project.displayName,
		},
		{
			envname: 'SUPERNOVA_GIT_URL',
			source: 'string',
			name: project_repo.url,
		},
		{
			envname: 'SUPERNOVA_GIT_BRANCH',
			source: 'string',
			name: project_repo.branch,
		},
	];
	const hook = {
		'id': project_name,
		'execute-command': 'bun',
		'pass-arguments-to-command': [
			{
				source: 'string',
				name: 'run',
			},
			{
				source: 'string',
				name: '/app/onhook.js',
			},
		],
		'pass-environment-to-command': hook_env,
	};

	if (typeof project.webhookSecret === 'string') {
		hook['trigger-rule'] = {
			match: {
				type: 'value',
				value: replaceVariables(project.webhookSecret, process.env),
				parameter: {
					source: 'url',
					name: 'secret',
				},
			},
		};
		hook['trigger-rule-mismatch-http-response-code'] = 403;
	}

	hook_env.push({
		envname: 'SUPERNOVA_ENV_EXTRA',
		source: 'string',
		name: JSON.stringify(project.env),
	});

	if (project.docker.imagesAllowed !== null) {
		hook_env.push({
			envname: 'SUPERNOVA_DOCKER_IMAGES_ALLOWED',
			source: 'string',
			name: JSON.stringify(project.docker.imagesAllowed),
		});
	}

	{ // eslint-disable-line no-lone-blocks
		for (const docker_login of Object.values(project.docker.login)) {
			docker_login.token = replaceVariables(docker_login.token, process.env);
		}
		hook_env.push({
			envname: 'SUPERNOVA_DOCKER_LOGIN',
			source: 'string',
			name: JSON.stringify(project.docker.login),
		});
	}

	hook_env.push({
		envname: 'SUPERNOVA_STEPS',
		source: 'string',
		name: JSON.stringify(project.steps),
	});

	{
		const notifiers = [];
		for (const notifier_name of project.notify) {
			const notifier = config.notifications[notifier_name];
			if (notifier === undefined) {
				throw new Error(`Notifier "${notifier_name}" is not defined.`);
			}

			notifiers.push(notifier);
		}

		hook_env.push({
			envname: 'SUPERNOVA_NOTIFIERS',
			source: 'string',
			name: JSON.stringify(notifiers),
		});
	}

	if (project_repo.token !== null) {
		const repo_user = replaceVariables(project_repo.user, process.env);
		const repo_token = replaceVariables(project_repo.token, process.env);

		hook_env.push({
			envname: 'SUPERNOVA_GIT_TOKEN',
			source: 'string',
			name: `${repo_user}:${repo_token}`,
		});
	}

	hooks.push(hook);
}

Bun.write(
	'hooks.json',
	JSON.stringify(hooks),
);
