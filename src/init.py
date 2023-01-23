
import json, yaml

from modules.env_template import use_env_vars

hooks = []

with open('/etc/supernova/config.yml', 'r') as stream:
	config = yaml.safe_load(stream)

	for name, data in config['notifications'].items():
		if 'telegram' == data['type']:
			data['chat_id'] = use_env_vars(data['chat_id'])
			data['bot_token'] = use_env_vars(data['bot_token'])

	for name, data in config['repos'].items():
		repo = data['repo']

		hook = {
			'id': name,
			'execute-command': 'python3',
			'pass-arguments-to-command': [
				{
					'source': 'string',
					'name': '/supernova/onhook.py',
				},
			],
			'pass-environment-to-command': [
				{
					'envname': 'SUPERNOVA_NAME',
					'source': 'string',
					'name': name
				},
				{
					'envname': 'SUPERNOVA_GIT_URL',
					'source': 'string',
					'name': repo['url'],
				},
				{
					'envname': 'SUPERNOVA_GIT_BRANCH',
					'source': 'string',
					'name': repo['branch'] if ('branch' in repo) else 'main',
				},
			],
		}

		if 'secret' in data:
			hook['trigger-rule'] = {
				'match': {
					'type': 'value',
					'value': use_env_vars(data['secret']),
					'parameter': {
						'source': 'url',
						'name': 'secret',
					},
				},
			}
			hook['trigger-rule-mismatch-http-response-code'] = 403

		if 'steps' in data:
			hook['pass-environment-to-command'].append({
				'envname': 'SUPERNOVA_STEPS',
				'source': 'string',
				'name': json.dumps(data['steps']),
			})

		if 'token' in repo:
			username = use_env_vars(repo['username']) if ('username' in repo) else 'user'
			token = use_env_vars(repo['token'])

			hook['pass-environment-to-command'].append({
				'envname': 'SUPERNOVA_GIT_TOKEN',
				'source': 'string',
				'name': '{}:{}'.format(username, token),
			})

		if 'notify' in data:
			hook['pass-environment-to-command'].append({
				'envname': 'SUPERNOVA_NOTIFICATIONS',
				'source': 'string',
				'name': json.dumps(config['notifications'][data['notify']]),
			})

		if 'env' in data:
			for key, value in data['env'].items():
				hook['pass-environment-to-command'].append({
					'envname': 'SUPERNOVA_' + key,
					'source': 'string',
					'name': value,
				})

		hooks.append(hook)

print(hooks)

with open('hooks.json', 'w') as stream:
	json.dump(
		hooks,
		stream,
		indent = 4,
	)
