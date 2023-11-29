
import {
	array,
	boolean,
	custom,
	minLength,
	never,
	object,
	optional,
	record,
	string,
	union }                      from 'valibot';
import { ENV_KEY_REGEXP }        from '../consts.js';
import stepsDockerBuildValidator from './steps.docker.build.js';

const DIRECTIVES = new Set([
	'/next',
	'/pause',
]);

const stepsNameValidator = string([
	minLength(1),
]);
const stepsBindValidator = optional(
	array(
		object({
			source: string([
				minLength(1),
			]),
			target: string([
				minLength(1),
			]),
			readonly: optional(
				boolean(),
				() => false,
			),
		}),
	),
	() => [],
);
const stepsCommandsValidator = array(
	union([
		string([
			minLength(1),
		]),
		record(
			string([
				custom((value) => ENV_KEY_REGEXP.test(value)),
			]),
			string([
				minLength(1),
			]),
			[
				custom((value) => Object.keys(value).length === 1),
			],
		),
	]),
);

export default array(
	union([
		string([
			custom((value) => DIRECTIVES.has(value)),
		]),
		// using docker
		object(
			{
				name: stepsNameValidator,
				docker: union([
					object(
						{
							build: stepsDockerBuildValidator,
						},
						never(),
					),
				]),
			},
			never(),
		),
		// using container
		object(
			{
				name: stepsNameValidator,
				container: string([
					minLength(1),
				]),
				commands: stepsCommandsValidator,
			},
			never(),
		),
		// using image
		object(
			{
				name: stepsNameValidator,
				image: optional(string([
					minLength(1),
				])),
				docker: optional(
					boolean(),
					() => false,
				),
				bind: stepsBindValidator,
				commands: stepsCommandsValidator,
			},
			never(),
		),
	]),
);
