
export class HTTPError extends Error {
	constructor(status_code, body) {
		super(`HTTP error: ${body}`);

		this.http = {
			status_code,
			body,
		};
	}

	get response() {
		return new Response(
			this.http.body,
			{
				status: this.http.status_code,
				headers: {
					'Content-Type': 'text/plain',
				},
			},
		);
	}
}

export class SupernovaConfigNotExistsError extends Error {
	constructor(path) {
		super(`Supernova config file does not exist at ${path}.`);

		this.path = path;
	}
}

export class SupernovaInvalidConfigError extends Error {
	constructor(path) {
		super(`Supernova config file at ${path} is invalid.`);

		this.path = path;
	}
}
