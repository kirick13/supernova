
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
