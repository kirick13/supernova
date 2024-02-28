
import { HTTPError } from './errors.js';
import serveHook     from './serve/hooks.js';
import serveRun      from './serve/run.js';

Bun.serve({
	development: false,
	port: 9000,
	async fetch(request) {
		try {
			const url = new URL(request.url);

			if (url.pathname.startsWith('/webhook/')) {
				return await serveHook(
					request,
					url,
				);
			}

			if (url.pathname.startsWith('/run/')) {
				return await serveRun(
					request,
					url,
				);
			}

			throw new HTTPError(404, 'Not found');
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
