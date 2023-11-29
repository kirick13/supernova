
import { mkdir }                   from 'node:fs/promises';
import { join as joinPath }        from 'node:path';
import { parse }                   from 'valibot';
import YAML                        from 'yaml';
import {
	SupernovaConfigNotExistsError,
	SupernovaConfigParseError,
	SupernovaConfigValidationError } from './errors.js';
import validateConfig              from './validator/main.js';
import projectValidator            from './validator/project.js';
import stepsValidator              from './validator/steps.js';

export function isPlainObject(value) {
	return typeof value === 'object' && value !== null && value.constructor === Object;
}

async function parseYamlFile(path) {
	const file = Bun.file(path);

	let file_text;
	try {
		file_text = await file.text();
	}
	catch (error) {
		if (error.code === 'ENOENT') {
			throw new SupernovaConfigNotExistsError(path);
		}

		throw error;
	}

	try {
		return YAML.parse(file_text);
	}
	catch {
		throw new SupernovaConfigParseError(path);
	}
}

export async function readConfig(path) {
	const config = await parseYamlFile(path);

	try {
		return validateConfig(config);
	}
	catch (error) {
		// console.log('error', error, error.issues);
		throw new SupernovaConfigValidationError(path, error.issues);
	}
}

export async function readProject(path) {
	const config = await parseYamlFile(path);

	try {
		// return projectValidator.cast(config);
		return parse(
			projectValidator,
			config,
		);
	}
	catch (error) {
		// console.log('error', error, error.issues);
		throw new SupernovaConfigValidationError(path, error.issues);
	}
}

export async function readSteps(path) {
	const config = await parseYamlFile(path);

	try {
		return parse(
			stepsValidator,
			config.steps,
		);
	}
	catch (error) {
		throw new SupernovaConfigValidationError(path, error.issues);
	}
}

export async function createProjectDirectory(project_name) {
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

const REPLACE_ENV_REGEXP = /\$([A-Z][\dA-Z_]*)/g;
export function replaceVariables(string, ...data) {
	for (const data_item of data) {
		string = string.replaceAll(
			REPLACE_ENV_REGEXP,
			(match, key) => {
				if (hasOwnProperty.call(data_item, key)) {
					return data_item[key];
				}

				return match;
			},
		);
	}

	return string;
}

export function checkPath(subpath) {
	const base_path = '/' + Math.random().toString(36).slice(-7);

	const path = joinPath(
		base_path,
		subpath,
	);

	return path.startsWith(base_path);
}

async function getFormData(data, files) {
	const form_data = new FormData();

	for (const [ key, value ] of Object.entries(data)) {
		form_data.append(
			key,
			value,
		);
	}

	for (const [ key, { path, name }] of Object.entries(files)) {
		const file = Bun.file(path);
		const file_buffer = await file.arrayBuffer(); // eslint-disable-line no-await-in-loop
		const file_blob = new Blob(
			[ file_buffer ],
			{
				type: file.type,
			},
		);

		form_data.append(
			key,
			file_blob,
			name,
		);
	}

	return form_data;
}

export async function httpPostRequest({
	url,
	headers = {},
	data = {},
	files = {},
}) {
	const form_data = await getFormData(data, files);

	const response = await fetch(
		url,
		{
			method: 'POST',
			headers,
			body: form_data,
		},
	);

	return {
		ok: response.ok,
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
		body: await response.json(),
	};
}
