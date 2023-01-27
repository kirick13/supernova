
import json, requests

def _call_method (method, bot_token, data = None, files = None):
	return requests.post(
		'https://discord.com/api/v10/{}'.format(method),
		headers = {
			'Authorization': 'Bot {}'.format(bot_token),
		},
		data = data,
		files = files,
	)

def send (notifier = None, text = None, log_file_name = None):
	chat_id = notifier['chat_id']
	bot_token = notifier['bot_token']

	api_method = 'channels/{}/messages'.format(chat_id)

	response = _call_method(
		api_method,
		bot_token = bot_token,
		data = {
			'content': text,
		},
	)
	# print('[send message] status code:', response.status_code)
	# print('[send message] body:', response.json())

	message_id = response.json()['id']

	if log_file_name:
		files = {
			'0': (
				'log.txt',
				open(log_file_name, 'rb'),
			),
		}

		response = _call_method(
			api_method,
			bot_token = bot_token,
			data = {
				'payload_json': json.dumps({
					'message_reference': {
						'message_id': message_id,
					},
				}),
			},
			files = files,
		)
		# print('[send file] status code:', response.status_code)
		# print('[send file] body:', response.json())
