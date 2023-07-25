
import { HTTPError } from '../errors.js';

export const run_ids = new Map();

export default async function (request, url) {
	const run_id = url.pathname.slice(5);

	if (typeof run_id !== 'string') {
		throw new HTTPError(400, 'Missing run ID');
	}

	const run_state = run_ids.get(run_id);

	if (run_state === true) {
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

	if (run_state === false) {
		return new Response(
			'Run is not finished',
			{
				status: 202,
				headers: {
					'Content-Type': 'text/plain',
				},
			},
		);
	}

	throw new HTTPError(404, 'Run not found');
}
