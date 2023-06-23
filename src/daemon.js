
import { mkdir } from 'node:fs/promises';

import { HTTPError } from './errors.js';
import hooks         from './hooks.js';

const SUPERNOVA_TOKEN = Array.from({ length: 6 }).fill(0).map(() => Math.random().toString(36).slice(-7)).join('');
await mkdir(
	'/var/run/supernova',
	{ recursive: true },
);
await Bun.write(
	'/var/run/supernova/token.txt',
	SUPERNOVA_TOKEN,
);

Bun.serve({
	development: false,
	port: 9000,
	async fetch(request) {
		try {
			const url = new URL(request.url);

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

				if (project.secret !== url.searchParams.get('secret')) {
					throw new HTTPError(403, 'Webhook secret mismatch');
				}
			}

			const pipeliner = new Pipeliner();
			pipeliner.print(`Running webhook "${project.name}"...`);

			execute(
				pipeliner,
				project,
			)
				.catch((error) => {
					console.error(error);
				});

			return new Response(
				'OK',
				{
					status: 200,
					headers: {
						'Content-Type': 'text/plain',
					},
				},
			);
		}
		catch (error) {
			if (error instanceof HTTPError) {
				return error.response;
			}

			throw error;
		}
	},
});

console.log('Listening for webhooks...');

async function execute(pipeliner, project) {
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
}

class Pipeliner {
	#run_id = Math.random().toString(36).slice(-7);
	#prefix = `\u001B[${Math.floor((Math.random() * 6) + 31)}m[${this.#run_id}]\u001B[0m `;

	get run_id() {
		return this.#run_id;
	}

	print(...chunks) {
		process.stdout.write(this.#prefix);

		for (const chunk of chunks) {
			if (chunk !== null) {
				process.stdout.write(chunk);
			}
		}

		process.stdout.write('\n');
	}

	async #iterate(async_iterable) {
		let buffer = null;

		for await (const chunk of async_iterable) {
			let index_subarray = 0;
			for (
				let index = 0;
				index < chunk.length;
				index++
			) {
				const byte = chunk[index];

				if (byte === 10) {
					this.print(
						buffer,
						chunk.subarray(
							index_subarray,
							index,
						),
					);

					buffer = null;
					index_subarray = index + 1;
				}
			}

			buffer = (index_subarray < chunk.length) ? chunk.subarray(index_subarray) : null;
		}
	}

	attach(async_iterable) {
		this.#iterate(async_iterable).catch((error) => console.error(error));
	}
}
