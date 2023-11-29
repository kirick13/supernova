
import {
	array,
	custom,
	minLength,
	never,
	object,
	optional,
	record,
	string }           from 'valibot';
import { FQDN_REGEXP } from '../consts.js';

export default optional(
	object(
		{
			imagesAllowed: optional(array(
				string([
					minLength(1),
				]),
			)),
			login: optional(
				record(
					string([
						custom((value) => value.length === 0 || FQDN_REGEXP.test(value)),
					]),
					object({
						user: string([
							minLength(1),
						]),
						token: string([
							minLength(1),
						]),
					}),
				),
				() => ({}),
			),
		},
		never(),
	),
	() => ({}),
);
