
import { HTTPError } from './errors.js';
import hooks         from './hooks.js';

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

			const pipeliner = new Pipeliner();
			pipeliner.print(`Running webhook "${project.name}"...`);

			if (project.secret !== url.searchParams.get('secret')) {
				throw new HTTPError(403, 'Webhook secret mismatch');
			}

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

async function execute(pipeline, project) {
	const proc = Bun.spawn(
		[
			'bun',
			'run',
			'onhook.js',
		],
		{
			env: {
				...process.env,
				...project.env,
			},
			stdout: 'pipe',
			stderr: 'pipe',
		},
	);

	pipeline.attach(proc.stdout);
	pipeline.attach(proc.stderr);

	await proc.exited;
}

class Pipeliner {
	#prefix = `\u001B[${Math.floor((Math.random() * 7) + 31)}m[${Math.random().toString(36).slice(-7)}]\u001B[0m `;

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
