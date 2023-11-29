
import {
	array,
	custom,
	minLength,
	never,
	object,
	optional,
	record,
	string } from 'valibot';

import { ENV_KEY_REGEXP }     from '../consts.js';
import projectDockerValidator from '../validator/project.docker.js';
import projectRepoValidator   from '../validator/project.repo.js';
import projectStepsValidator  from '../validator/steps.js';

export default object(
	{
		displayName: optional(string([
			minLength(1),
		])),
		webhookSecret: string([
			minLength(1),
		]),
		repo: projectRepoValidator,
		env: optional(
			record(
				string([
					custom((value) => ENV_KEY_REGEXP.test(value)),
				]),
				string([
					minLength(1),
				]),
			),
			() => ({}),
		),
		docker: projectDockerValidator,
		steps: projectStepsValidator,
		notify: optional(
			array(
				string([
					minLength(1),
				]),
			),
			() => [],
		),
	},
	never(),
);
