
import {
	minLength,
	never,
	object,
	optional,
	string,
	union } from 'valibot';

export default union([
	object(
		{
			path: string([
				minLength(1),
			]),
		},
		never(),
	),
	object(
		{
			url: string([
				minLength(1),
			]),
			branch: optional(
				string([
					minLength(1),
				]),
				() => 'main',
			),
			user: optional(
				string([
					minLength(1),
				]),
				() => 'user',
			),
			token: optional(string([
				minLength(1),
			])),
		},
		never(),
	),
]);
