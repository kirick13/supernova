
import { file_name as log_file_name } from '../../run/logger.file.js';
import { httpPostRequest }            from '../../utils.js';

async function callAPI(
	method,
	bot_token,
	data = {},
	files = {},
) {
	return httpPostRequest({
		url: `https://discord.com/api/v10/${method}`,
		headers: {
			Authorization: `Bot ${bot_token}`,
		},
		data,
		files,
	});
}

export default async function (
	{
		bot_token,
		chat_id,
	},
	text,
	add_log = false,
) {
	const api_method = `channels/${chat_id}/messages`;

	const response_message = await callAPI(
		api_method,
		bot_token,
		{
			content: text,
		},
	);
	if (process.env.SUPERNOVA_DEBUG) {
		console.log('response_message', response_message);
	}

	if (add_log) {
		const message_id = response_message.body.id;

		const response_file = await callAPI(
			api_method,
			bot_token,
			{
				payload_json: JSON.stringify({
					message_reference: {
						message_id,
					},
				}),
			},
			{
				0: {
					path: log_file_name,
					name: 'log.txt',
				},
			},
		);
		if (process.env.SUPERNOVA_DEBUG) {
			console.log('response_file', response_file);
		}
	}
}
