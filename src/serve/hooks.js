
import { mkdir } from 'node:fs/promises';

import Pipeliner     from '../class/pipeliner.js';
import { HTTPError } from '../errors.js';
import hooks         from '../hooks.js';

import { run_ids } from './run.js';

const SUPERNOVA_TOKEN = Array.from({ length: 6 }).fill(0).map(() => Math.random().toString(36).slice(-7)).join('');
await mkdir(
	'/var/run/supernova',
	{ recursive: true },
);
await Bun.write(
	'/var/run/supernova/token.txt',
	SUPERNOVA_TOKEN,
);

export default async function (request, url) {
	if (hooks.has(url.pathname) !== true) {
		throw new HTTPError(404, 'Not found');
	}

	const project = hooks.get(url.pathname);

	const supernova_token = request.headers.get('X-Supernova-Token');
	if (typeof supernova_token === 'string') {
		if (supernova_token !== SUPERNOVA_TOKEN) {
			throw new HTTPError(403, 'Supernova token mismatch');
		}
	}
	else {
		if (url.searchParams.get('check_branch') === 'true') {
			if (request.headers.get('X-GitHub-Event') !== 'push') {
				throw new HTTPError(400, 'Unsupported event name');
			}

			if (request.method !== 'POST') {
				throw new HTTPError(405, 'Method not allowed');
			}

			let body;
			switch (request.headers.get('Content-Type')) {
				case 'application/json':
					body = await request.json();
					break;
				case 'application/x-www-form-urlencoded':
					body = Object.fromEntries(
						new URLSearchParams(
							await request.text(),
						),
					);
					break;
				default:
					throw new HTTPError(415, 'Unsupported media type');
			}

			if (typeof body.ref !== 'string') {
				throw new HTTPError(400, 'Invalid ref value');
			}

			if (body.ref.split('/').pop() !== project.repo.branch) {
				return new Response(
					'Accepted',
					{
						status: 202,
						headers: {
							'Content-Type': 'text/plain',
						},
					},
				);
			}
		}

		if (
			project.secret !== url.searchParams.get('secret')
			&& `Secret ${project.secret}` !== request.headers.get('Authorization')
		) {
			throw new HTTPError(403, 'Webhook secret mismatch');
		}
	}

	const pipeliner = new Pipeliner();
	pipeliner.print(`Running webhook "${project.name}"...`);

	execute(
		pipeliner,
		project,
	).catch((error) => {
		console.error(error);
	});

	return new Response(
		pipeliner.run_id,
		{
			status: 200,
			headers: {
				'Content-Type': 'text/plain',
			},
		},
	);
}

async function execute(pipeliner, project) {
	run_ids.set(
		pipeliner.run_id,
		false,
	);

	const proc = Bun.spawn(
		[
			'bun',
			'run',
			'onhook.js',
		],
		{
			env: {
				...process.env,
				SUPERNOVA_RUN_ID: pipeliner.run_id,
				...project.env,
			},
			stdout: 'pipe',
			stderr: 'pipe',
		},
	);

	pipeliner.attach(proc.stdout);
	pipeliner.attach(proc.stderr);

	await proc.exited;

	run_ids.set(
		pipeliner.run_id,
		true,
	);
}
