
// import { createMultiTypeValidator,
//          createObjectValidator   } from 'oh-my-props';

import {
	boolean,
	custom,
	minLength,
	never,
	object,
	optional,
	parse,
	picklist,
	record,
	string,
	union }             from 'valibot';
import { NAME_REGEXP }  from '../consts.js';
import validatorProject from './project.js';

// /*
const configValidator = object(
	{
		projects: optional(
			record(
				string([
					custom((value) => NAME_REGEXP.test(value)),
				]),
				union([
					string([
						minLength(1),
					]),
					validatorProject,
				]),
			),
			() => ({}),
		),
		notifications: optional(
			record(
				string([
					custom((value) => NAME_REGEXP.test(value)),
				]),
				object(
					{
						type: picklist([
							'discord',
							'telegram',
						]),
						logs: optional(
							boolean(),
							() => false,
						),
						chat_id: string([
							minLength(1),
						]),
						bot_token: string([
							minLength(1),
						]),
					},
					never(),
				),
			),
			() => ({}),
		),
	},
	never(),
);
// */

/*
const configValidator = createObjectValidator({
	projects: {
		type: Object,
		default: () => ({}),
		keys: {
			type: String,
			validator: (value) => NAME_REGEXP.test(value),
		},
		values: createMultiTypeValidator(
			{
				type: String,
				validator: (value) => value.length > 0,
			},
			validatorProject,
		),
	},
	notifications: {
		type: Object,
		default: () => ({}),
		keys: {
			type: String,
			validator: (value) => NAME_REGEXP.test(value),
		},
		values: {
			type: Object,
			entries: {
				type: {
					type: String,
					validator: (value) => value === 'telegram' || value === 'discord',
				},
				logs: {
					type: Boolean,
					default: false,
				},
				chat_id: {
					type: String,
					validator: (value) => value.length > 0,
				},
				bot_token: {
					type: String,
					validator: (value) => value.length > 0,
				},
			},
		},
	},
});
*/

export default function (config) {
	// return configValidator.cast(config ?? {});
	return parse(
		configValidator,
		config ?? {},
	);
}
