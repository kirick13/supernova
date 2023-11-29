
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

export default function (config) {
	return parse(
		configValidator,
		config ?? {},
	);
}
