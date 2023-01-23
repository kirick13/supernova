
import requests

def _call_method (method, bot_token, data = None, files = None):
	return requests.post(
		'https://api.telegram.org/bot{}/{}'.format(bot_token, method),
		data = data,
		files = files,
	)

def send (credentials = None, text = None, log_file_name = None):
	chat_id = credentials['chat_id']
	bot_token = credentials['bot_token']

	response = _call_method(
		'sendMessage',
		bot_token = bot_token,
		data = {
			'chat_id': chat_id,
			'text': text,
			'parse_mode': 'markdown',
		},
	)
	# print('sendMessage status code:', response.status_code)
	# print('sendMessage body:', response.json())

	message_id = response.json()['result']['message_id']

	if log_file_name:
		files = {
			'document': (
				'log.txt',
				open(log_file_name, 'rb'),
			),
		}

		response = _call_method(
			'sendDocument',
			bot_token = bot_token,
			data = {
				'chat_id': chat_id,
				'reply_to_message_id': message_id,
			},
			files = files,
		)
		# print('sendDocument status code:', response.status_code)
		# print('sendDocument body:', response.json())
