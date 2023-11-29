
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

export class SupernovaConfigParseError extends Error {
	constructor(path) {
		super(`Supernova config file at ${path} is not valid YAML file.`);

		this.path = path;
	}
}

function traverseIssues(issues, path_nested = [], result = []) {
	for (const issue of issues) {
		if (Array.isArray(issue.path)) {
			const path = [
				...path_nested,
				...issue.path.map((a) => a.key),
			];
			result.push(
				path.join('.'),
			);

			if (Array.isArray(issue.issues) === true) {
				console.log('traverse deeper');
				traverseIssues(
					issue.issues,
					path,
				);
			}
		}
	}

	return result;
}
export class SupernovaConfigValidationError extends Error {
	constructor(path, issues) {
		super(`Supernova config file at ${path} is invalid.`);

		this.path = path;
		this.issues_paths = traverseIssues(issues);
	}
}
