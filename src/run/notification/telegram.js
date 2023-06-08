
import { file_name as log_file_name } from '../../run/logger.file.js';
import { httpPostRequest }                from '../../utils.js';

async function callAPI(
	method,
	bot_token,
	data = {},
	files = {},
) {
	return httpPostRequest({
		url: `https://api.telegram.org/bot${bot_token}/${method}`,
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
	const response_message = await callAPI(
		'sendMessage',
		bot_token,
		{
			chat_id,
			text,
			parse_mode: 'markdown',
		},
	);
	if (process.env.SUPERNOVA_DEBUG) {
		console.log('response_message', response_message);
	}

	if (add_log) {
		const { message_id } = response_message.body.result;

		const response_file = await callAPI(
			'sendDocument',
			bot_token,
			{
				chat_id,
				reply_to_message_id: message_id,
			},
			{
				document: {
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
