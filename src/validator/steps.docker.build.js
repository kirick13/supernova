
import {
	array,
	custom,
	minLength,
	never,
	object,
	optional,
	record,
	string }              from 'valibot';
import { ENV_KEY_REGEXP } from '../consts.js';

export default optional(object(
	{
		file: optional(string([
			minLength(1),
		])),
		context: optional(
			string([
				minLength(1),
			]),
			() => '.',
		),
		tag: string([
			minLength(1),
		]),
		args: optional(record(
			string([
				custom((value) => ENV_KEY_REGEXP.test(value)),
			]),
			string([
				minLength(1),
			]),
		)),
		platforms: optional(array(
			string([
				minLength(1),
			]),
		)),
	},
	never(),
));
