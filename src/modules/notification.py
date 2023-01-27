
from .telegram import send as telegram_send
from .discord import send as discord_send

def send_notification (
	exit_code = None,
	log_file_name = None,
	repo_display_name = None,
	notifiers = None,
):
	is_ok = exit_code == 0

	if is_ok:
		text = '✅ Build passed'
	else:
		text = '❌ Build failed'

	text += f': *{ repo_display_name }*'
	text_logs = ''

	if not is_ok:
		with open(log_file_name, 'r') as file:
			last_lines_list = file.read().splitlines()[-10:]
			last_lines = '\n'.join(last_lines_list)
			text_logs = '\n\n*Exit code:* {}\n*Output log:*\n```\n{}```'.format(exit_code, last_lines)

	for notifier in notifiers:
		text_here = text
		log_file_name_here = None
		if not is_ok and 'logs' in notifier and notifier['logs'] == True:
			text_here += text_logs
			log_file_name_here = log_file_name

		if notifier['type'] == 'telegram':
			telegram_send(
				notifier = notifier,
				text = text_here,
				log_file_name = log_file_name_here,
			)
		elif notifier['type'] == 'discord':
			discord_send(
				notifier = notifier,
				text = text_here,
				log_file_name = log_file_name_here,
			)
		else:
			print('Unknown notifier type:', notifier['type'])
